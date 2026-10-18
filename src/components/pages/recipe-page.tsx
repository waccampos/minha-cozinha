"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import RecipeMissing from "@/components/common/recipe-missing";
import RecipeForm from "@/components/forms/recipe-form";
import ReviewPage from "@/components/forms/review-form";
import CookingMode from "@/components/pages/cooking-mode";
import Detail from "@/components/pages/recipe-detail";
import { useKitchen } from "@/hooks/use-kitchen";
import type { Review, Preparation } from "@/types/kitchen";
import type { Recipe } from "@/types/recipe";

type RecipeRouteProps = {
  id: string;
  view: "detail" | "cooking" | "form" | "review";
};

export default function RecipeRoute({ id, view }: RecipeRouteProps) {
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

  if (missing && !recipes.some((r) => r.id === Number(id)))
    return <RecipeMissing />;

  if (!data)
    return (
      <main className="shell page">
        <p role={error ? "alert" : "status"}>
          {error || "Carregando receita…"}
        </p>
      </main>
    );

  const { recipe, reviews, preparations } = data;

  if (!recipe) return <RecipeMissing />;

  if (view === "form") return <RecipeForm key={recipe.id} recipe={recipe} />;

  if (view === "review")
    return (
      <ReviewPage
        key={params.get("avaliacao") ?? "new"}
        recipe={recipe}
        review={reviews.find(
          (r) => r.id === params.get("avaliacao") && r.recipeId === recipe.id,
        )}
      />
    );

  if (view === "cooking") return <CookingMode recipe={recipe} />;

  return (
    <>
      <p className="sr-only" role="alert">
        {error}
      </p>
      <Detail recipe={recipe} reviews={reviews} preparations={preparations} />
    </>
  );
}
