import type { ReviewValues } from "@/schemas/review.schema";

import type { Recipe } from "./recipe";

export type Review = ReviewValues & {
  id: string;
  recipeId: number;
  preparationId: string;
};

export type Preparation = {
  id: string;
  recipeId: number;
  date: string;
  notes: string;
  reviewId: string | null;
};

export type ShoppingGroup = { name: string; items: string[] };

export type ShoppingItem = {
  id: string;
  label: string;
  group: string;
  checked: boolean;
  recipeId: number | null;
};

export type NamedEntity = { id: number; name: string };

export type KitchenState = {
  categoryCounts: Record<string, number>;
  recipeOptions: { id: number; title: string; image: string }[];
  recipeCount: number;
  recipes: Recipe[];
  favorites: number[];
  reviews: Review[];
  preparations: Preparation[];
  plan: Record<string, number>;
  shopping: ShoppingGroup[];
  checked: string[];
  shoppingItems: ShoppingItem[];
  lists: { id: string; name: string; current: boolean }[];
  currentListId: string | null;
  categories: NamedEntity[];
  tags: NamedEntity[];
};

export const emptyKitchen: KitchenState = {
  categoryCounts: {},
  recipeOptions: [],
  recipeCount: 0,
  recipes: [],
  favorites: [],
  reviews: [],
  preparations: [],
  plan: {},
  shopping: [],
  checked: [],
  shoppingItems: [],
  lists: [],
  currentListId: null,
  categories: [],
  tags: [],
};
