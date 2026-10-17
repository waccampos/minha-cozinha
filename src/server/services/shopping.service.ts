import "server-only";

import { databaseDate } from "@/lib/dates";
import { DomainError } from "@/lib/errors";
import type { Transaction } from "@/server/database/prisma";
import { plannedMealsInRange } from "@/server/repositories/planning.repository";
import * as shopping from "@/server/repositories/shopping.repository";

export async function removeShoppingList(tx: Transaction, id: string) {
  await shopping.deleteShoppingList(tx, id);

  if (!(await shopping.findCurrentShoppingList(tx))) {
    const latest = await shopping.findLatestShoppingList(tx);

    if (latest) {
      await shopping.selectShoppingList(tx, latest.id);
    }
  }
}

export async function generateShoppingList(
  tx: Transaction,
  start: string,
  end: string,
) {
  const startDate = databaseDate(start);
  const endDate = databaseDate(end);

  if (start > end || endDate.getTime() - startDate.getTime() > 31 * 86400000) {
    throw new DomainError("Escolha um intervalo de até 31 dias.");
  }

  const meals = await plannedMealsInRange(tx, startDate, endDate);

  if (!meals.length) {
    throw new DomainError(
      "Planeje ao menos uma refeição antes de gerar a lista.",
    );
  }

  const list = await shopping.saveShoppingList(tx, `Semana ${start}`);

  // Conservar medidas por refeição evita somar unidades incompatíveis.
  await shopping.addShoppingItems(
    tx,
    meals.flatMap((meal) =>
      meal.recipe.ingredients.map((ingredient) => ({
        listId: list.id,
        label: [ingredient.quantity, ingredient.unit, ingredient.name]
          .filter(Boolean)
          .join(" "),
        group: "Receitas planejadas",
        recipeId: meal.recipeId,
      })),
    ),
  );

  await shopping.selectShoppingList(tx, list.id);

  return list.id;
}
