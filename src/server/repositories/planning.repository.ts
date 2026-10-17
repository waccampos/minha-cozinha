import "server-only";

import type { Transaction } from "@/server/database/prisma";

export async function persistMeal(
  tx: Transaction,
  date: Date,
  meal: number,
  recipeId: number | null,
) {
  if (recipeId === null) {
    await tx.planningEntry.deleteMany({ where: { date, meal } });
  } else {
    await tx.planningEntry.upsert({
      where: { date_meal: { date, meal } },
      create: { date, meal, recipeId },
      update: { recipeId },
    });
  }
}

export function plannedMealsInRange(tx: Transaction, start: Date, end: Date) {
  return tx.planningEntry.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      recipe: { include: { ingredients: { orderBy: { position: "asc" } } } },
    },
    orderBy: [{ date: "asc" }, { meal: "asc" }],
  });
}
