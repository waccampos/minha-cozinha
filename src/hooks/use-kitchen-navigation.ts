"use client";

import { useRouter } from "next/navigation";

import { pageHref, type Page } from "@/lib/navigation";
import type { Recipe } from "@/types/recipe";

export default function useKitchenNavigation(id?: number) {
  const router = useRouter();

  return {
    navigate: (page: Page) => router.push(pageHref(page, id)),
    openRecipe: (recipe: Pick<Recipe, "id">) =>
      router.push(pageHref("detail", recipe.id)),
    runSearch: (query: string) =>
      router.push(`/busca?q=${encodeURIComponent(query)}`),
    openPantry: () => router.push("/busca?modo=despensa"),
  };
}
