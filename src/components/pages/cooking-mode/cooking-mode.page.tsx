"use client";

import IngredientList from "@/components/common/ingredient-list";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import type { Recipe } from "@/types/recipe";

import useCookingModeController from "./cooking-mode.controller";

type CookingModeProps = {
  recipe: Recipe;
};

export default function CookingMode({ recipe }: CookingModeProps) {
  const {
    step,
    ingredients,
    isLastStep,
    progress,
    leaveCooking,
    showIngredients,
    hideIngredients,
    previousStep,
    nextStep,
  } = useCookingModeController(recipe);

  return (
    <main className="cooking-mode">
      <header>
        <button className="brand" onClick={leaveCooking}>
          <span className="brand-mark">M</span>
          <span>
            Minha <i>Cozinha</i>
          </span>
        </button>
        <span>Modo cozinha</span>
        <button aria-label="Sair do modo cozinha" onClick={leaveCooking}>
          <Icon name="x" />
        </button>
      </header>
      <div className="cook-progress">
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className="cook-layout">
        <aside className={ingredients ? "open" : ""}>
          <button
            aria-label="Fechar ingredientes"
            className="close-ingredients"
            onClick={hideIngredients}
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
          <button className="ingredients-mobile" onClick={showIngredients}>
            Ver ingredientes
          </button>
          <div className="cook-controls">
            <Button variant="soft" onClick={previousStep}>
              Anterior
            </Button>
            <Button onClick={nextStep}>
              {isLastStep ? "Finalizar preparo" : "Próxima etapa"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
