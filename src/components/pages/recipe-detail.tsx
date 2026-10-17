"use client";

import Link from "next/link";
import { useState } from "react";

import IngredientList from "@/components/common/ingredient-list";
import RecipeImage from "@/components/common/recipe-image";
import RecipeSteps from "@/components/common/recipe-steps";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import Modal from "@/components/ui/modal";
import RatingStars from "@/components/ui/rating-stars";
import SectionHeading from "@/components/ui/section-heading";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import type { Preparation, Review } from "@/types/kitchen";
import type { Recipe } from "@/types/recipe";

export default function Detail({
  recipe,
  reviews,
  preparations,
}: {
  recipe: Recipe;
  reviews: Review[];
  preparations: Preparation[];
}) {
  const {
    favorites: favoriteIds,
    toggleFavorite: onFavorite,
    command,
    pending,
  } = useKitchen();

  const [deleting, setDeleting] = useState(false);
  const [editPrep, setEditPrep] = useState<Preparation | null>(null);
  const [deleteReview, setDeleteReview] = useState<string | null>(null);
  const favorite = favoriteIds.includes(recipe.id);
  const { navigate } = useKitchenNavigation(recipe.id);

  return (
    <main className="detail-page">
      <section className="detail-hero shell">
        <div className="detail-image">
          <RecipeImage src={recipe.image} alt={recipe.title} />
          <span>{recipe.category}</span>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{recipe.tags.join(" · ")}</p>
          <h1>{recipe.title}</h1>
          <p className="lead">{recipe.description}</p>
          <div className="rating-line">
            <RatingStars value={recipe.rating} />
            <strong>{recipe.rating}</strong>
            <span>({recipe.reviews} preparos)</span>
          </div>
          <div className="stat-row">
            <div>
              <Icon name="clock" />
              <span>
                Preparo<strong>{recipe.time} minutos</strong>
              </span>
            </div>
            <div>
              <span className="stat-icon">⌁</span>
              <span>
                Rendimento<strong>{recipe.servings}</strong>
              </span>
            </div>
            <div>
              <span className="stat-icon">◌</span>
              <span>
                Dificuldade<strong>{recipe.difficulty}</strong>
              </span>
            </div>
          </div>
          <div className="detail-actions">
            <Button onClick={() => navigate("cooking")} icon="play">
              Iniciar preparo
            </Button>
            <Button
              variant="soft"
              onClick={() => navigate("review")}
              icon="star"
            >
              Avaliar
            </Button>
            <button
              className={`icon-btn detail-heart ${favorite ? "active" : ""}`}
              onClick={() => onFavorite(recipe.id)}
              aria-label={
                favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
              }
              aria-pressed={favorite}
            >
              <Icon name="heart" />
            </button>
            <button
              className="icon-btn"
              onClick={() => navigate("form")}
              aria-label="Editar receita"
            >
              <Icon name="edit" />
            </button>
            <button className="text-action" onClick={() => setDeleting(true)}>
              Excluir receita
            </button>
          </div>
        </div>
      </section>
      <section className="shell recipe-body">
        <div>
          <div className="content-block">
            <SectionHeading
              eyebrow={`${recipe.ingredients.length} itens`}
              title="Ingredientes"
            />
            <IngredientList items={recipe.ingredients} />
          </div>
          <div className="content-block">
            <SectionHeading eyebrow="Passo a passo" title="Modo de preparo" />
            <RecipeSteps steps={recipe.steps} />
          </div>
        </div>
        <aside>
          <div className="tip-card">
            <p className="eyebrow">Notas da cozinha</p>
            <h3>O segredo desta receita</h3>
            <p>{recipe.notes || "Nenhuma observação registrada."}</p>
          </div>
          <div className="info-card">
            <span>Temperatura</span>
            <strong>{recipe.temperature}</strong>
            <span>Perfil de sabor</span>
            <strong>{recipe.flavor}</strong>
            <span>Características</span>
            <div className="chips">
              {recipe.tags.map((t) => (
                <button key={t}>{t}</button>
              ))}
            </div>
          </div>
        </aside>
      </section>
      <section className="tinted section">
        <div className="shell history">
          <SectionHeading
            eyebrow="Diário da receita"
            title="Seus últimos preparos"
            action="Registrar preparo"
            onAction={() => navigate("review")}
          />
          <div className="history-grid">
            {reviews
              .filter((item) => item.recipeId === recipe.id)
              .map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "long",
                        timeZone: "UTC",
                      }).format(new Date(`${item.date}T12:00:00Z`))}
                    </strong>
                    <RatingStars value={item.rating} />
                  </div>
                  <p>{item.experience}</p>
                  {item.changes && <p>{item.changes}</p>}
                  {item.image && (
                    <RecipeImage
                      className="review-photo"
                      src={item.image}
                      alt="Resultado do preparo"
                    />
                  )}
                  <div className="history-actions">
                    <Link
                      className="text-action"
                      href={`/receitas/${recipe.id}/avaliar?avaliacao=${item.id}`}
                    >
                      Editar avaliação
                    </Link>
                    <button
                      className="text-action"
                      onClick={() => setDeleteReview(item.id)}
                    >
                      Excluir avaliação
                    </button>
                    <button
                      className="text-action"
                      onClick={() =>
                        setEditPrep(
                          preparations.find(
                            (p) => p.id === item.preparationId,
                          ) ?? null,
                        )
                      }
                    >
                      Editar preparo
                    </button>
                  </div>
                </article>
              ))}
            {preparations
              .filter((p) => p.recipeId === recipe.id && !p.reviewId)
              .map((p) => (
                <article key={p.id}>
                  <strong>
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "long",
                      timeZone: "UTC",
                    }).format(new Date(`${p.date}T12:00:00Z`))}
                  </strong>
                  <p>{p.notes || "Preparo concluído, ainda sem avaliação."}</p>
                  <div className="history-actions">
                    <Link
                      className="text-action"
                      href={`/receitas/${recipe.id}/avaliar?preparo=${p.id}`}
                    >
                      Avaliar preparo
                    </Link>
                    <button
                      className="text-action"
                      onClick={() => setEditPrep(p)}
                    >
                      Editar preparo
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
      {deleting && (
        <Modal title="Excluir receita" onClose={() => setDeleting(false)}>
          <p>
            Excluir esta receita, seus preparos, avaliações e refeições
            planejadas? Esta ação não pode ser desfeita.
          </p>
          <div className="review-actions">
            <Button variant="ghost" onClick={() => setDeleting(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (
                  !pending &&
                  (await command({ type: "recipe.delete", id: recipe.id }))
                )
                  navigate("library");
              }}
            >
              Excluir receita
            </Button>
          </div>
        </Modal>
      )}
      {deleteReview && (
        <Modal title="Excluir avaliação" onClose={() => setDeleteReview(null)}>
          <p>
            Excluir esta avaliação? O registro do preparo será mantido no
            diário.
          </p>
          <div className="review-actions">
            <Button variant="ghost" onClick={() => setDeleteReview(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (
                  !pending &&
                  (await command({ type: "review.delete", id: deleteReview }))
                )
                  setDeleteReview(null);
              }}
            >
              Excluir avaliação
            </Button>
          </div>
        </Modal>
      )}
      {editPrep && (
        <Modal title="Editar preparo" onClose={() => setEditPrep(null)}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();

              const data = new FormData(event.currentTarget);

              if (
                await command({
                  type: "preparation.save",
                  id: editPrep.id,
                  recipeId: recipe.id,
                  date: String(data.get("date")),
                  notes: String(data.get("notes")),
                })
              )
                setEditPrep(null);
            }}
          >
            <div className="field">
              <label htmlFor="prep-date">Data</label>
              <input
                id="prep-date"
                type="date"
                name="date"
                defaultValue={editPrep.date}
                required
              />
              <label htmlFor="prep-notes">Observações</label>
              <textarea
                id="prep-notes"
                name="notes"
                defaultValue={editPrep.notes}
                maxLength={5000}
              />
            </div>
            <details>
              <summary>Excluir preparo</summary>
              <p>Remove também a avaliação deste preparo.</p>
              <Button
                variant="ghost"
                onClick={async () => {
                  if (
                    await command({
                      type: "preparation.delete",
                      id: editPrep.id,
                    })
                  )
                    setEditPrep(null);
                }}
              >
                Confirmar exclusão do preparo
              </Button>
            </details>
            <div className="review-actions">
              <Button variant="ghost" onClick={() => setEditPrep(null)}>
                Cancelar
              </Button>
              <button
                className="btn btn-primary"
                disabled={pending}
                type="submit"
              >
                Salvar preparo
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
