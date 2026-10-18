"use client";

import { useState, type FormEvent } from "react";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import type { Preparation, Review } from "@/types/kitchen";
import type { Recipe } from "@/types/recipe";

export default function useRecipeDetailController(
  recipe: Recipe,
  reviews: Review[],
  preparations: Preparation[],
) {
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

  const recipeReviews = reviews.filter(
    (review) => review.recipeId === recipe.id,
  );

  const unreviewedPreparations = preparations.filter(
    (preparation) =>
      preparation.recipeId === recipe.id && !preparation.reviewId,
  );

  const formatPreparationDate = (date: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`));

  const startCooking = () => navigate("cooking");
  const reviewRecipe = () => navigate("review");
  const editRecipe = () => navigate("form");
  const toggleFavorite = () => onFavorite(recipe.id);
  const openRecipeDeletion = () => setDeleting(true);
  const closeRecipeDeletion = () => setDeleting(false);
  const closeReviewDeletion = () => setDeleteReview(null);
  const closePreparationEditing = () => setEditPrep(null);
  const editReviewPreparation = (preparationId: string) =>
    setEditPrep(
      preparations.find((preparation) => preparation.id === preparationId) ??
        null,
    );

  const confirmRecipeDeletion = async () => {
    if (!pending && (await command({ type: "recipe.delete", id: recipe.id })))
      navigate("library");
  };

  const confirmReviewDeletion = async () => {
    if (
      deleteReview &&
      !pending &&
      (await command({ type: "review.delete", id: deleteReview }))
    )
      setDeleteReview(null);
  };

  const savePreparation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editPrep) return;

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
  };

  const deletePreparation = async () => {
    if (
      editPrep &&
      (await command({ type: "preparation.delete", id: editPrep.id }))
    )
      setEditPrep(null);
  };

  return {
    pending,
    deleting,
    editPrep,
    deleteReview,
    favorite,
    recipeReviews,
    unreviewedPreparations,
    formatPreparationDate,
    startCooking,
    reviewRecipe,
    editRecipe,
    toggleFavorite,
    openRecipeDeletion,
    closeRecipeDeletion,
    openReviewDeletion: setDeleteReview,
    closeReviewDeletion,
    editPreparation: setEditPrep,
    closePreparationEditing,
    editReviewPreparation,
    confirmRecipeDeletion,
    confirmReviewDeletion,
    savePreparation,
    deletePreparation,
  };
}
