"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import RecipeImage from "@/components/common/recipe-image";
import Button from "@/components/ui/button";
import ImageUploader from "@/components/ui/image-uploader";
import Modal from "@/components/ui/modal";
import RatingStars from "@/components/ui/rating-stars";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import { reviewSchema, type ReviewValues } from "@/schemas/review.schema";
import type { Review } from "@/types/kitchen";
import type { Recipe } from "@/types/recipe";

const ratings = [
  "Ainda sem nota",
  "Pode melhorar",
  "Razoável",
  "Muito bom",
  "Delicioso",
  "Inesquecível",
];

export default function ReviewPage({
  recipe,
  review,
  onSaved,
}: {
  recipe: Recipe;
  review?: Review;
  onSaved?: () => void;
}) {
  const { navigate } = useKitchenNavigation(recipe.id);
  const { saveReview, pending } = useKitchen();
  const params = useSearchParams();
  const [saved, setSaved] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: review ?? {
      rating: 0,
      date: new Date().toISOString().slice(0, 10),
      experience: "",
      changes: "",
      image: "",
    },
  });

  return (
    <main className="review-page shell page">
      <div className="review-recipe">
        <RecipeImage src={recipe.image} alt="" />
        <div>
          <p className="eyebrow">Diário de preparo</p>
          <h1>{review ? "Editar avaliação" : "Como ficou desta vez?"}</h1>
          <p>
            Registre sua experiência com <strong>{recipe.title}</strong>.
          </p>
        </div>
      </div>
      <form
        className="review-card"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          if (
            await saveReview(
              recipe.id,
              values,
              review?.id,
              params.get("preparo") ?? undefined,
            )
          ) {
            if (onSaved) onSaved();
            else setSaved(true);
          }
        })}
      >
        <div className="rating-question">
          <h2>Sua avaliação</h2>
          <p>Toque nas estrelas para avaliar</p>
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <>
                <RatingStars
                  value={field.value}
                  interactive
                  onChange={field.onChange}
                />
                <strong>{ratings[field.value]}</strong>
              </>
            )}
          />
          {errors.rating && (
            <p className="field-error" role="alert">
              {errors.rating.message}
            </p>
          )}
        </div>
        <div className="fields-grid">
          <div className="field">
            <label htmlFor="review-date">Data do preparo</label>
            <input
              id="review-date"
              type="date"
              {...register("date")}
              aria-invalid={!!errors.date}
            />
            {errors.date && (
              <small className="field-error" role="alert">
                {errors.date.message}
              </small>
            )}
          </div>
          <div className="field full">
            <label htmlFor="review-experience">Como foi a experiência?</label>
            <textarea
              id="review-experience"
              rows={4}
              placeholder="Conte o que você achou do resultado..."
              {...register("experience")}
              aria-invalid={!!errors.experience}
            />
            {errors.experience && (
              <small className="field-error" role="alert">
                {errors.experience.message}
              </small>
            )}
          </div>
          <div className="field full">
            <label htmlFor="review-changes">
              O que mudaria na próxima vez?
            </label>
            <textarea
              id="review-changes"
              rows={3}
              placeholder="Mais tempero, outro tempo de forno..."
              {...register("changes")}
            />
            {errors.changes && (
              <small className="field-error" role="alert">
                {errors.changes.message}
              </small>
            )}
          </div>
          <div className="field full">
            <span className="field-label">Fotos do resultado</span>
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <ImageUploader value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.image && (
              <small className="field-error" role="alert">
                {errors.image.message}
              </small>
            )}
          </div>
        </div>
        <div className="review-actions">
          <Button
            variant="ghost"
            onClick={() => (onSaved ? onSaved() : navigate("detail"))}
          >
            Cancelar
          </Button>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            Salvar avaliação
          </button>
        </div>
      </form>
      {saved && (
        <Modal title="Avaliação registrada" onClose={() => navigate("detail")}>
          <p>Seu preparo foi adicionado ao diário desta receita.</p>
          <Button onClick={() => navigate("detail")}>
            Voltar para a receita
          </Button>
        </Modal>
      )}
    </main>
  );
}
