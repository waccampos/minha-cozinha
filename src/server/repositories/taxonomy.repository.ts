import "server-only";

import type { Transaction } from "@/server/database/prisma";

export function findCategoriesByNames(tx: Transaction, names: string[]) {
  return tx.category.findMany({ where: { name: { in: names } } });
}

export function saveCategory(tx: Transaction, name: string, id?: number) {
  return id
    ? tx.category.update({ where: { id }, data: { name } })
    : tx.category.create({ data: { name } });
}

export function deleteCategory(tx: Transaction, id: number) {
  return tx.category.delete({ where: { id } });
}

export function saveTag(tx: Transaction, name: string, id?: number) {
  return id
    ? tx.tag.update({ where: { id }, data: { name } })
    : tx.tag.create({ data: { name } });
}

export function deleteTag(tx: Transaction, id: number) {
  return tx.tag.delete({ where: { id } });
}

export async function recipeIdsForCategory(
  tx: Transaction,
  categoryId: number,
) {
  const rows = await tx.recipe.findMany({
    where: { categories: { some: { categoryId } } },
    select: { id: true },
  });

  return rows.map((row) => row.id);
}

export async function recipeIdsForTag(tx: Transaction, tagId: number) {
  const rows = await tx.recipeTag.findMany({
    where: { tagId },
    select: { recipeId: true },
  });

  return rows.map((row) => row.recipeId);
}
