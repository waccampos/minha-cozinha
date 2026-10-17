import { z } from "zod";

import { imageSchema } from "./image.schema";

const text = (label: string) =>
  z.string().trim().min(1, `${label} é obrigatório.`);

export const recipeCategoriesSchema = z
  .array(text("Categoria").max(80))
  .min(1, "Selecione ao menos uma categoria.")
  .max(30, "Selecione até 30 categorias.")
  .refine(
    (names) => new Set(names).size === names.length,
    "Não repita categorias.",
  );

export const recipeFormSchema = z.object({
  title: text("Nome").max(120, "Use até 120 caracteres."),
  description: text("Descrição").max(2000),
  categories: recipeCategoriesSchema,
  time: z
    .number({ error: "Informe o tempo em minutos." })
    .int()
    .min(1, "Use pelo menos 1 minuto.")
    .max(1440, "Use até 1440 minutos."),
  servings: text("Rendimento").max(120),
  difficulty: z.enum(["Fácil", "Médio", "Avançado"]),
  temperature: z.enum(["Quente", "Fria", "Gelada", "Ambiente"]),
  flavor: z.enum(["Salgado", "Doce", "Misto"]),
  image: imageSchema,
  ingredients: z
    .array(
      z.object({
        quantity: z.string().trim().max(80),
        unit: z.string().max(40),
        name: text("Ingrediente").max(200),
      }),
    )
    .min(1, "Adicione ao menos um ingrediente.")
    .max(200),
  steps: z
    .array(z.object({ text: text("Etapa").max(4000) }))
    .min(1, "Adicione ao menos uma etapa.")
    .max(100),
  tags: z.array(z.string().trim().min(1).max(80)).max(30),
  notes: z.string().trim().max(5000),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
