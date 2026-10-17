import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Recipe } from "@/types/recipe";

export const recipeInclude = {
  category: true,
  image: true,
  ingredients: { orderBy: { position: "asc" } },
  steps: { orderBy: { position: "asc" } },
  tags: { include: { tag: true } },
  favorite: true,
} satisfies Prisma.RecipeInclude;

type RecipeRow = Prisma.RecipeGetPayload<{ include: typeof recipeInclude }>;

export function recipeDto(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.imageId
      ? `/api/images/${row.imageId}`
      : "/images/recipe-placeholder.svg",
    category: row.category.name,
    time: row.time,
    servings: row.servings,
    difficulty: row.difficulty as Recipe["difficulty"],
    temperature: row.temperature,
    flavor: row.flavor,
    notes: row.notes,
    favorite: !!row.favorite,
    tags: row.tags.map((t) => t.tag.name),
    ingredients: row.ingredients.map((i) =>
      [i.quantity, i.unit, i.name].filter(Boolean).join(" "),
    ),
    ingredientDetails: row.ingredients.map((i) => ({
      quantity: i.quantity,
      unit: i.unit,
      name: i.name,
    })),
    steps: row.steps.map((s) => s.text),
    reviews: row.reviewCount,
    rating: row.rating,
  };
}
