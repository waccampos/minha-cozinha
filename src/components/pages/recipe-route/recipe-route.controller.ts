"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useKitchen } from "@/hooks/use-kitchen";
import type { Review, Preparation } from "@/types/kitchen";
import type { Recipe } from "@/types/recipe";

export default function useRecipeRouteController(id: string) {
  const params = useSearchParams();
  const { recipes } = useKitchen();
  const [data, setData] = useState<{
    recipe: Recipe;
    reviews: Review[];
    preparations: Preparation[];
  } | null>(null);

  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const response = await fetch(`/api/recipes/${encodeURIComponent(id)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (response.status === 404) {
          setMissing(true);

          return;
        }

        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setData(result);
        setMissing(false);
        setError("");
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar a receita.",
          );
      }
    };

    void run();

    return () => controller.abort();
  }, [id, recipes]);

  const reviewKey = params.get("avaliacao") ?? "new";
  const selectedReview = data?.reviews.find(
    (review) =>
      review.id === params.get("avaliacao") &&
      review.recipeId === data.recipe.id,
  );

  const isMissing =
    missing && !recipes.some((recipe) => recipe.id === Number(id));

  return { data, error, isMissing, reviewKey, selectedReview };
}
