import { z } from "zod";

import { recipeFormSchema } from "@/schemas/recipe.schema";
import { reviewSchema } from "@/schemas/review.schema";

const id = z.number().int().positive();

const uuid = z.uuid();

const name = z.string().trim().min(1).max(80);

export const dateSchema = z.iso
  .date()
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Data inválida.",
  );

const recipeValues = recipeFormSchema.extend({
  image: z.string().regex(/^(?:|\/api\/images\/[a-f0-9-]{36})$/),
  tags: z.array(name).max(30).default([]),
});

const reviewValues = reviewSchema.extend({
  date: dateSchema,
  image: z.string().regex(/^(?:|\/api\/images\/[a-f0-9-]{36})$/),
});

export const commandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("recipe.save"),
    id: id.optional(),
    values: recipeValues,
  }),
  z.object({ type: z.literal("recipe.delete"), id }),
  z.object({
    type: z.literal("favorite.set"),
    recipeId: id,
    value: z.boolean(),
  }),
  z.object({
    type: z.literal("review.save"),
    id: uuid.optional(),
    recipeId: id,
    preparationId: uuid.optional(),
    values: reviewValues,
  }),
  z.object({ type: z.literal("review.delete"), id: uuid }),
  z.object({
    type: z.literal("preparation.save"),
    id: uuid.optional(),
    recipeId: id,
    date: dateSchema,
    notes: z.string().trim().max(5000).default(""),
  }),
  z.object({ type: z.literal("preparation.delete"), id: uuid }),
  z.object({ type: z.literal("category.save"), id: id.optional(), name }),
  z.object({ type: z.literal("category.delete"), id }),
  z.object({ type: z.literal("tag.save"), id: id.optional(), name }),
  z.object({ type: z.literal("tag.delete"), id }),
  z.object({
    type: z.literal("meal.set"),
    date: dateSchema,
    meal: z.number().int().min(0).max(3),
    recipeId: id.nullable(),
  }),
  z.object({
    type: z.literal("list.save"),
    id: uuid.optional(),
    name: z.string().trim().min(1).max(120),
  }),
  z.object({ type: z.literal("list.select"), id: uuid }),
  z.object({ type: z.literal("list.delete"), id: uuid }),
  z.object({
    type: z.literal("shopping.add"),
    listId: uuid,
    label: z.string().trim().min(1).max(300),
    group: name.default("Outros"),
  }),
  z.object({
    type: z.literal("shopping.update"),
    id: uuid,
    label: z.string().trim().min(1).max(300).optional(),
    checked: z.boolean().optional(),
    group: name.optional(),
  }),
  z.object({ type: z.literal("shopping.delete"), id: uuid }),
  z.object({ type: z.literal("shopping.clear"), listId: uuid }),
  z.object({
    type: z.literal("shopping.generate"),
    start: dateSchema,
    end: dateSchema,
  }),
]);

export type KitchenCommand = z.input<typeof commandSchema>;

export type ValidatedCommand = z.output<typeof commandSchema>;

export type CommandOf<T extends ValidatedCommand["type"]> = Extract<
  ValidatedCommand,
  { type: T }
>;
