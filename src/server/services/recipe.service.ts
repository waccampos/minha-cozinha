import "server-only";

import { DomainError } from "@/lib/errors";
import { canonical } from "@/lib/search-parser";
import type { CommandOf } from "@/schemas/kitchen-command.schema";
import { recipeListInput } from "@/schemas/recipe-list.schema";
import type { Transaction } from "@/server/database/prisma";
import {
  persistRecipe,
  replaceRecipeContents,
  findRecipeSearchSource,
  updateRecipeSearch,
} from "@/server/repositories/recipe.repository";
import {
  findRecipePage,
  findRecipeDetail,
} from "@/server/repositories/recipe.repository";
import { findCategoryByName } from "@/server/repositories/taxonomy.repository";

import { resolveImageId } from "./image.service";

export function listRecipes(input: unknown) {
  return findRecipePage(recipeListInput.parse(input));
}

export function recipeDetail(id: number) {
  return findRecipeDetail(id);
}

export async function rebuildRecipeSearch(tx: Transaction, id: number) {
  const recipe = await findRecipeSearchSource(tx, id);
  const searchText = canonical(
    [
      recipe.title,
      recipe.description,
      recipe.category.name,
      recipe.notes,
      ...recipe.ingredients.map((ingredient) => ingredient.name),
      ...recipe.tags.map((link) => link.tag.name),
    ].join(" "),
  );

  await updateRecipeSearch(tx, id, searchText);
}

export async function saveRecipe(
  tx: Transaction,
  command: CommandOf<"recipe.save">,
) {
  const { ingredients, steps, tags, image, category, ...values } =
    command.values;

  const categoryRow = await findCategoryByName(tx, category);

  if (!categoryRow) {
    throw new DomainError("Selecione uma categoria existente.");
  }

  const recipe = await persistRecipe(
    tx,
    {
      ...values,
      categoryId: categoryRow.id,
      imageId: await resolveImageId(tx, image),
    },
    command.id,
  );

  await replaceRecipeContents(tx, recipe.id, { ingredients, steps, tags });
  await rebuildRecipeSearch(tx, recipe.id);

  return recipe.id;
}
