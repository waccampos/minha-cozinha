"use client";

import RecipeImage from "@/components/common/recipe-image";
import Button from "@/components/ui/button";
import type { Recipe } from "@/types/recipe";

type PantryResultProps = {
  item: {
    recipe: Recipe;
    matched: string[];
    missing: string[];
    percentage: number;
  };
  onOpen: (recipe: Recipe) => void;
  ready?: boolean;
};

export default function PantryResult({
  item,
  onOpen,
  ready = false,
}: PantryResultProps) {
  return (
    <article className="pantry-result">
      <RecipeImage src={item.recipe.image} alt="" loading="lazy" />
      <div className="pantry-result-main">
        <div>
          <span className={ready ? "ready-label" : ""}>
            {ready ? "Boa combinação" : "Quase lá"}
          </span>
          <h3>{item.recipe.title}</h3>
          <p>
            {item.matched.length} de {item.recipe.ingredients.length}{" "}
            ingredientes encontrados
          </p>
        </div>
        <div
          className="percentage-ring"
          style={
            {
              "--percentage": `${item.percentage * 3.6}deg`,
            } as React.CSSProperties
          }
        >
          <strong>{item.percentage}%</strong>
          <span>disponível</span>
        </div>
      </div>
      <div className="missing-items">
        <strong>Faltam</strong>
        <div>
          {item.missing.slice(0, 3).map((missing) => (
            <span key={missing}>{missing}</span>
          ))}
          {item.missing.length > 3 && <span>+{item.missing.length - 3}</span>}
        </div>
      </div>
      <Button variant="soft" onClick={() => onOpen(item.recipe)}>
        Ver receita
      </Button>
    </article>
  );
}
