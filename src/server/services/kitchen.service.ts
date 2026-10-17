import "server-only";

import { databaseDate } from "@/lib/dates";
import {
  commandSchema,
  type ValidatedCommand,
} from "@/schemas/kitchen-command.schema";
import { writeTransaction, type Transaction } from "@/server/database/prisma";
import { snapshot } from "@/server/repositories/kitchen.repository";
import { persistMeal } from "@/server/repositories/planning.repository";
import {
  deleteRecipe,
  setRecipeFavorite,
} from "@/server/repositories/recipe.repository";
import * as shopping from "@/server/repositories/shopping.repository";
import { deleteCategory } from "@/server/repositories/taxonomy.repository";

import { saveRecipe } from "./recipe.service";
import {
  saveReview,
  removeReview,
  savePreparation,
  removePreparation,
} from "./review.service";
import { generateShoppingList, removeShoppingList } from "./shopping.service";
import { saveCategory, saveTag, removeTag } from "./taxonomy.service";

async function apply(
  tx: Transaction,
  command: ValidatedCommand,
): Promise<string | number | undefined> {
  switch (command.type) {
    case "recipe.save":
      return saveRecipe(tx, command);

    case "recipe.delete":
      await deleteRecipe(tx, command.id);

      return;

    case "favorite.set":
      await setRecipeFavorite(tx, command.recipeId, command.value);

      return;

    case "review.save":
      return saveReview(tx, command);

    case "review.delete":
      await removeReview(tx, command.id);

      return;

    case "preparation.save":
      return savePreparation(tx, command);

    case "preparation.delete":
      await removePreparation(tx, command.id);

      return;

    case "category.save":
      return saveCategory(tx, command.name, command.id);

    case "category.delete":
      await deleteCategory(tx, command.id);

      return;

    case "tag.save":
      return saveTag(tx, command.name, command.id);

    case "tag.delete":
      await removeTag(tx, command.id);

      return;

    case "meal.set":
      await persistMeal(
        tx,
        databaseDate(command.date),
        command.meal,
        command.recipeId,
      );

      return;

    case "list.save": {
      const list = await shopping.saveShoppingList(
        tx,
        command.name,
        command.id,
      );

      return list.id;
    }

    case "list.select":
      await shopping.selectShoppingList(tx, command.id);

      return;

    case "list.delete":
      await removeShoppingList(tx, command.id);

      return;

    case "shopping.add": {
      const item = await shopping.addShoppingItem(tx, {
        listId: command.listId,
        label: command.label,
        group: command.group,
      });

      return item.id;
    }

    case "shopping.update":
      await shopping.updateShoppingItem(tx, command.id, {
        label: command.label,
        checked: command.checked,
        group: command.group,
      });

      return;

    case "shopping.delete":
      await shopping.deleteShoppingItem(tx, command.id);

      return;

    case "shopping.clear":
      await shopping.clearPurchasedItems(tx, command.listId);

      return;

    case "shopping.generate":
      return generateShoppingList(tx, command.start, command.end);
  }
}

export async function executeCommand(input: unknown) {
  const command = commandSchema.parse(input);

  return writeTransaction(async (tx) => {
    const id = await apply(tx, command);

    return { id, state: await snapshot(tx) };
  });
}
