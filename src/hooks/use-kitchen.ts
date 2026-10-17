"use client";

import { createContext, useContext } from "react";

import type { KitchenCommand } from "@/schemas/kitchen-command.schema";
import type { RecipeFormValues } from "@/schemas/recipe.schema";
import type { ReviewValues } from "@/schemas/review.schema";
import type { KitchenState } from "@/types/kitchen";
import type { Recipe } from "@/types/recipe";

export type MutationResult = {
  id?: string | number;
  state: KitchenState;
} | null;

export type Kitchen = KitchenState & {
  pending: boolean;
  error: string;
  clearError: () => void;
  command: (
    input: KitchenCommand | ((state: KitchenState) => KitchenCommand),
  ) => Promise<MutationResult>;
  toggleFavorite: (id: number) => Promise<void>;
  saveRecipe: (
    values: RecipeFormValues,
    id?: number,
  ) => Promise<Pick<Recipe, "id"> | undefined>;
  saveReview: (
    recipeId: number,
    values: ReviewValues,
    id?: string,
    preparationId?: string,
  ) => Promise<boolean>;
  setMeal: (key: string, recipeId: number | null) => Promise<boolean>;
  addShopping: (label: string) => Promise<boolean>;
  clearPurchased: () => Promise<void>;
  generateShopping: (start: string, end: string) => Promise<boolean>;
};

export const KitchenContext = createContext<Kitchen | null>(null);

export function useKitchen() {
  const context = useContext(KitchenContext);

  if (!context) throw new Error("KitchenProvider ausente.");

  return context;
}
