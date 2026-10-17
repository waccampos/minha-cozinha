"use client";

import Link from "next/link";

import RecipeImage from "@/components/common/recipe-image";
import Icon from "@/components/ui/icon";
import type { Recipe } from "@/types/recipe";

export default function RecipeCard({
  recipe,
  list = false,
  favorite = recipe.favorite,
  onFavorite,
  reason,
}: {
  recipe: Recipe;
  onOpen: (r: Recipe) => void;
  list?: boolean;
  favorite?: boolean;
  onFavorite?: (id: number) => void;
  reason?: string;
}) {
  return (
    <article className={`recipe-card ${list ? "list-card" : ""}`}>
      <div className="card-image">
        <Link
          href={`/receitas/${recipe.id}`}
          className="card-image-link"
          aria-label={`Abrir receita ${recipe.title}`}
        >
          <RecipeImage src={recipe.image} alt={recipe.title} />
        </Link>
        <span className="category-pill">{recipe.category}</span>
        <button
          className={`heart ${favorite ? "active" : ""}`}
          onClick={() => onFavorite?.(recipe.id)}
          aria-label={
            favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
          aria-pressed={favorite}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>
      <div className="card-content">
        <div>
          <p className="eyebrow">{recipe.tags[0]}</p>
          <h3>
            <Link href={`/receitas/${recipe.id}`}>{recipe.title}</Link>
          </h3>
          {reason && (
            <p className="match-reason">
              <Icon name="check" size={14} />
              {reason}
            </p>
          )}
        </div>
        <div className="recipe-meta">
          <span>
            <Icon name="clock" size={15} />
            {recipe.time} min
          </span>
          <span>{recipe.difficulty}</span>
          <span className="rating">
            <Icon name="star" size={14} />
            {recipe.rating}
          </span>
        </div>
      </div>
    </article>
  );
}
