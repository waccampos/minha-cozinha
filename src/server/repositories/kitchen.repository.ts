import "server-only";

import { getDb, type Transaction } from "@/server/database/prisma";
import type { KitchenState } from "@/types/kitchen";

import { recipeDto, recipeInclude } from "./recipe.mapper";

export async function snapshot(tx: Transaction): Promise<KitchenState> {
  // A transação compartilha uma conexão; aguardar cada consulta evita enfileiramento no pg.
  const recent = await tx.recipe.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const recipeOptions = await tx.recipe.findMany({
    select: { id: true, title: true, imageId: true },
    orderBy: { title: "asc" },
  });

  const favorites = await tx.favorite.findMany();

  const reviews = await tx.review.findMany({
    include: { preparation: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const preparations = await tx.preparation.findMany({
    include: { review: { select: { id: true } } },
    orderBy: { date: "desc" },
    take: 100,
  });

  const meals = await tx.planningEntry.findMany();

  const lists = await tx.shoppingList.findMany({
    include: {
      items: {
        where: { list: { current: true } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = await tx.category.findMany({
    include: { _count: { select: { recipes: true } } },
    orderBy: { name: "asc" },
  });

  const tags = await tx.tag.findMany({ orderBy: { name: "asc" } });

  const ids = [
    ...new Set([
      ...recent.map((r) => r.id),
      ...meals.map((m) => m.recipeId),
      ...lists
        .filter((l) => l.current)
        .flatMap((l) =>
          l.items.flatMap((i) => (i.recipeId ? [i.recipeId] : [])),
        ),
    ]),
  ];

  const recipes = await tx.recipe.findMany({
    where: { id: { in: ids } },
    include: recipeInclude,
    orderBy: { createdAt: "desc" },
  });

  const current = lists.find((list) => list.current);
  const items = current?.items ?? [];
  const groups = new Map<string, string[]>();

  for (const item of items)
    groups.set(item.group, [...(groups.get(item.group) ?? []), item.label]);

  return {
    recipeOptions: recipeOptions.map((r) => ({
      id: r.id,
      title: r.title,
      image: r.imageId
        ? `/api/images/${r.imageId}`
        : "/images/recipe-placeholder.svg",
    })),
    recipeCount: recipeOptions.length,
    categoryCounts: Object.fromEntries(
      categories.map((c) => [c.name, c._count.recipes]),
    ),
    recipes: recipes.map(recipeDto),
    favorites: favorites.map((r) => r.recipeId),
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
    plan: Object.fromEntries(
      meals.map((m) => [
        `${m.date.toISOString().slice(0, 10)}:${m.meal}`,
        m.recipeId,
      ]),
    ),
    shopping: [...groups].map(([name, items]) => ({ name, items })),
    checked: items.filter((i) => i.checked).map((i) => i.label),
    shoppingItems: items.map((i) => ({
      id: i.id,
      label: i.label,
      group: i.group,
      checked: i.checked,
      recipeId: i.recipeId,
    })),
    lists: lists.map((l) => ({ id: l.id, name: l.name, current: l.current })),
    currentListId: current?.id ?? null,
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    tags: tags.map((t) => ({ id: t.id, name: t.name })),
  };
}

export async function readKitchen() {
  return getDb().$transaction(snapshot, {
    isolationLevel: "RepeatableRead",
    timeout: 20000,
  });
}
