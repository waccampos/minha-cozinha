import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { canonical } from "@/lib/search-parser";
import type { RecipeListQuery } from "@/schemas/recipe-list.schema";
import type { RecipeFormValues } from "@/schemas/recipe.schema";
import type { Transaction } from "@/server/database/prisma";
import { getDb } from "@/server/database/prisma";
import { recipeDto, recipeInclude } from "@/server/repositories/recipe.mapper";

export async function findRecipePage(query: RecipeListQuery) {
  const where: Prisma.RecipeWhereInput = {
    ...(query.q ? { searchText: { contains: canonical(query.q) } } : {}),
    ...(query.category ? { category: { name: query.category } } : {}),
    ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    ...(query.temperature ? { temperature: query.temperature } : {}),
    time: { lte: query.maxTime },
    rating: { gte: query.rating },
    ...(query.favorites === "true" ? { favorite: { isNot: null } } : {}),
  };

  const orderBy: Prisma.RecipeOrderByWithRelationInput[] =
    query.sort === "time"
      ? [{ time: "asc" }, { id: "desc" }]
      : query.sort === "rating"
        ? [{ rating: "desc" }, { id: "desc" }]
        : [{ id: "desc" }];

  return getDb().$transaction(
    async (tx) => {
      const total = await tx.recipe.count({ where });

      const items = await tx.recipe.findMany({
        where,
        orderBy,
        take: query.limit,
        skip: (query.page - 1) * query.limit,
        include: {
          ...recipeInclude,
          ingredients: { take: 0 },
          steps: { take: 0 },
        },
      });

      return {
        items: items.map(recipeDto),
        total,
        page: query.page,
        pages: Math.ceil(total / query.limit),
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}

export async function findRecipeDetail(id: number) {
  return getDb().$transaction(
    async (tx) => {
      const recipe = await tx.recipe.findUnique({
        where: { id },
        include: recipeInclude,
      });

      if (!recipe) return null;

      const reviews = await tx.review.findMany({
        where: { recipeId: id },
        include: { preparation: true },
        orderBy: { createdAt: "desc" },
      });

      const preparations = await tx.preparation.findMany({
        where: { recipeId: id },
        include: { review: { select: { id: true } } },
        orderBy: { date: "desc" },
      });

      return {
        recipe: recipeDto(recipe),
        reviews: reviews.map((r) => ({
          id: r.id,
          recipeId: r.recipeId,
          preparationId: r.preparationId,
          rating: r.rating,
          date: r.preparation.date.toISOString().slice(0, 10),
          experience: r.experience,
          changes: r.changes,
          image: r.imageId ? `/api/images/${r.imageId}` : "",
        })),
        preparations: preparations.map((p) => ({
          id: p.id,
          recipeId: p.recipeId,
          date: p.date.toISOString().slice(0, 10),
          notes: p.notes,
          reviewId: p.review?.id ?? null,
        })),
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}

export async function persistRecipe(
  tx: Transaction,
  data: Prisma.RecipeUncheckedCreateInput,
  id?: number,
) {
  return id
    ? tx.recipe.update({ where: { id }, data })
    : tx.recipe.create({ data });
}

export async function replaceRecipeContents(
  tx: Transaction,
  recipeId: number,
  values: Pick<RecipeFormValues, "ingredients" | "steps" | "tags">,
) {
  await tx.ingredient.deleteMany({ where: { recipeId } });
  await tx.preparationStep.deleteMany({ where: { recipeId } });
  await tx.recipeTag.deleteMany({ where: { recipeId } });

  await tx.ingredient.createMany({
    data: values.ingredients.map((ingredient, position) => ({
      ...ingredient,
      position,
      recipeId,
      normalized: canonical(ingredient.name),
    })),
  });

  await tx.preparationStep.createMany({
    data: values.steps.map((step, position) => ({
      ...step,
      position,
      recipeId,
    })),
  });

  for (const name of new Set(values.tags)) {
    const tag = await tx.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });

    await tx.recipeTag.create({ data: { recipeId, tagId: tag.id } });
  }
}

export function findRecipeSearchSource(tx: Transaction, id: number) {
  return tx.recipe.findUniqueOrThrow({
    where: { id },
    include: {
      category: true,
      ingredients: true,
      tags: { include: { tag: true } },
    },
  });
}

export function updateRecipeSearch(
  tx: Transaction,
  id: number,
  searchText: string,
) {
  return tx.recipe.update({ where: { id }, data: { searchText } });
}

export function updateRecipeRating(
  tx: Transaction,
  id: number,
  rating: number,
  reviewCount: number,
) {
  return tx.recipe.update({ where: { id }, data: { rating, reviewCount } });
}

export function deleteRecipe(tx: Transaction, id: number) {
  return tx.recipe.delete({ where: { id } });
}

export async function setRecipeFavorite(
  tx: Transaction,
  recipeId: number,
  value: boolean,
) {
  if (value) {
    await tx.favorite.upsert({
      where: { recipeId },
      create: { recipeId },
      update: {},
    });
  } else {
    await tx.favorite.deleteMany({ where: { recipeId } });
  }
}
