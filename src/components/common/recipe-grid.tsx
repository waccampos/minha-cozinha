"use client";

import RecipeCard from "@/components/common/recipe-card";
import type { Recipe } from "@/types/recipe";

export default function RecipeGrid({
  items,
  onOpen,
  list = false,
  favorites,
  onFavorite,
  reasons,
}: {
  items: Recipe[];
  onOpen: (r: Recipe) => void;
  list?: boolean;
  favorites?: Set<number>;
  onFavorite?: (id: number) => void;
  reasons?: Record<number, string>;
}) {
  return (
    <div className={list ? "recipe-list" : "recipe-grid"}>
      {items.map((r) => (
        <RecipeCard
          key={r.id}
          recipe={r}
          onOpen={onOpen}
          list={list}
          favorite={favorites?.has(r.id) ?? r.favorite}
          onFavorite={onFavorite}
          reason={reasons?.[r.id]}
        />
      ))}
    </div>
  );
}
