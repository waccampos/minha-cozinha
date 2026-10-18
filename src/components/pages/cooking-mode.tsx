"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import IngredientList from "@/components/common/ingredient-list";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import type { Recipe } from "@/types/recipe";

type CookingModeProps = {
  recipe: Recipe;
};

export default function CookingMode({ recipe }: CookingModeProps) {
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

  return (
    <main className="cooking-mode">
      <header>
        <button className="brand" onClick={() => navigate("detail")}>
          <span className="brand-mark">M</span>
          <span>
            Minha <i>Cozinha</i>
          </span>
        </button>
        <span>Modo cozinha</span>
        <button
          aria-label="Sair do modo cozinha"
          onClick={() => navigate("detail")}
        >
          <Icon name="x" />
        </button>
      </header>
      <div className="cook-progress">
        <i style={{ width: `${((step + 1) / recipe.steps.length) * 100}%` }} />
      </div>
      <div className="cook-layout">
        <aside className={ingredients ? "open" : ""}>
          <button
            aria-label="Fechar ingredientes"
            className="close-ingredients"
            onClick={() => setIngredients(false)}
          >
            <Icon name="x" />
          </button>
          <p className="eyebrow">Para ter à mão</p>
          <h2>Ingredientes</h2>
          <IngredientList items={recipe.ingredients} />
        </aside>
        <section className="cook-step">
          <p className="eyebrow">{recipe.title}</p>
          <span className="step-counter">
            Etapa {step + 1} de {recipe.steps.length}
          </span>
          <h1>{recipe.steps[step]}</h1>
          <div className="cook-tip">
            <span>Uma dica</span>
            <p>
              Faça com calma e prove durante o preparo. Seu paladar é o melhor
              guia.
            </p>
          </div>
          <button
            className="ingredients-mobile"
            onClick={() => setIngredients(true)}
          >
            Ver ingredientes
          </button>
          <div className="cook-controls">
            <Button
              variant="soft"
              onClick={() => setStep(Math.max(0, step - 1))}
            >
              Anterior
            </Button>
            <Button
              onClick={() => {
                if (!pending) {
                  if (step === recipe.steps.length - 1) void finish();
                  else setStep(step + 1);
                }
              }}
            >
              {step === recipe.steps.length - 1
                ? "Finalizar preparo"
                : "Próxima etapa"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
