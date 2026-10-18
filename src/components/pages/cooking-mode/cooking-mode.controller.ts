"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import type { Recipe } from "@/types/recipe";

export default function useCookingModeController(recipe: Recipe) {
  const { navigate } = useKitchenNavigation(recipe.id);
  const router = useRouter();
  const { command, pending } = useKitchen();

  const finish = async () => {
    const result = await command({
      type: "preparation.save",
      recipeId: recipe.id,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });

    if (result?.id)
      router.push(`/receitas/${recipe.id}/avaliar?preparo=${result.id}`);
  };

  const [step, setStep] = useState(0);
  const [ingredients, setIngredients] = useState(false);

  const isLastStep = step === recipe.steps.length - 1;
  const progress = ((step + 1) / recipe.steps.length) * 100;
  const leaveCooking = () => navigate("detail");
  const showIngredients = () => setIngredients(true);
  const hideIngredients = () => setIngredients(false);
  const previousStep = () => setStep(Math.max(0, step - 1));

  const nextStep = () => {
    if (!pending) {
      if (isLastStep) void finish();
      else setStep(step + 1);
    }
  };

  return {
    step,
    ingredients,
    isLastStep,
    progress,
    leaveCooking,
    showIngredients,
    hideIngredients,
    previousStep,
    nextStep,
  };
}
