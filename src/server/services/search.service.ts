import "server-only";

import { parseSearch } from "@/lib/search-parser";
import { searchInput, pantryInput } from "@/schemas/search.schema";
import { findPantryRecipes } from "@/server/repositories/pantry.repository";
import { findMatchingRecipes } from "@/server/repositories/search.repository";

export async function searchRecipes(input: unknown) {
  const values = searchInput.parse(input);
  const parsed = {
    ...parseSearch(values.q),
    ...Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) =>
          key !== "q" && key !== "category" && value !== undefined,
      ),
    ),
  };

  if (values.category) {
    parsed.categories = [...new Set([...parsed.categories, values.category])];
  }

  return findMatchingRecipes(parsed);
}

export async function pantrySearch(input: unknown) {
  const ingredients = pantryInput.parse(input);

  return ingredients.length ? findPantryRecipes(ingredients) : [];
}
