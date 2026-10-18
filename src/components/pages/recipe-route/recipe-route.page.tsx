"use client";

import RecipeMissing from "@/components/common/recipe-missing";
import RecipeForm from "@/components/forms/recipe-form";
import ReviewPage from "@/components/forms/review-form";
import CookingMode from "@/components/pages/cooking-mode/cooking-mode.page";
import Detail from "@/components/pages/recipe-detail/recipe-detail.page";

import useRecipeRouteController from "./recipe-route.controller";

type RecipeRouteProps = {
  id: string;
  view: "detail" | "cooking" | "form" | "review";
};

export default function RecipeRoute({ id, view }: RecipeRouteProps) {
  const { data, error, isMissing, reviewKey, selectedReview } =
    useRecipeRouteController(id);

  if (isMissing) return <RecipeMissing />;

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
      <ReviewPage key={reviewKey} recipe={recipe} review={selectedReview} />
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
