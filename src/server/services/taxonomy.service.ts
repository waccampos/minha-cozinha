import "server-only";

import type { Transaction } from "@/server/database/prisma";
import * as taxonomy from "@/server/repositories/taxonomy.repository";

import { rebuildRecipeSearch } from "./recipe.service";

export async function saveCategory(tx: Transaction, name: string, id?: number) {
  const category = await taxonomy.saveCategory(tx, name, id);
  const recipes = await taxonomy.recipeIdsForCategory(tx, category.id);

  for (const recipeId of recipes) {
    await rebuildRecipeSearch(tx, recipeId);
  }

  return category.id;
}

export async function saveTag(tx: Transaction, name: string, id?: number) {
  const tag = await taxonomy.saveTag(tx, name, id);
  const recipes = await taxonomy.recipeIdsForTag(tx, tag.id);

  for (const recipeId of recipes) {
    await rebuildRecipeSearch(tx, recipeId);
  }

  return tag.id;
}

export async function removeTag(tx: Transaction, id: number) {
  const recipes = await taxonomy.recipeIdsForTag(tx, id);

  await taxonomy.deleteTag(tx, id);

  for (const recipeId of recipes) {
    await rebuildRecipeSearch(tx, recipeId);
  }
}
