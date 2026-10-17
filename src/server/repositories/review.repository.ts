import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Transaction } from "@/server/database/prisma";

export function findReview(tx: Transaction, id: string) {
  return tx.review.findUniqueOrThrow({ where: { id } });
}

export function findPreparation(tx: Transaction, id: string) {
  return tx.preparation.findUniqueOrThrow({
    where: { id },
    include: { review: true },
  });
}

export function persistReview(
  tx: Transaction,
  data: Prisma.ReviewUncheckedCreateInput,
  id?: string,
) {
  return id
    ? tx.review.update({ where: { id }, data })
    : tx.review.create({ data });
}

export function persistPreparation(
  tx: Transaction,
  data: Prisma.PreparationUncheckedCreateInput,
  id?: string,
) {
  return id
    ? tx.preparation.update({ where: { id }, data })
    : tx.preparation.create({ data });
}

export function updatePreparationDate(tx: Transaction, id: string, date: Date) {
  return tx.preparation.update({ where: { id }, data: { date } });
}

export function deleteReview(tx: Transaction, id: string) {
  return tx.review.delete({ where: { id } });
}

export function deletePreparation(tx: Transaction, id: string) {
  return tx.preparation.delete({ where: { id } });
}

export function aggregateRecipeRatings(tx: Transaction, recipeId: number) {
  return tx.review.aggregate({
    where: { recipeId },
    _avg: { rating: true },
    _count: { rating: true },
  });
}
