import "server-only";

import { databaseDate } from "@/lib/dates";
import { DomainError } from "@/lib/errors";
import type { CommandOf } from "@/schemas/kitchen-command.schema";
import type { Transaction } from "@/server/database/prisma";
import { updateRecipeRating } from "@/server/repositories/recipe.repository";
import * as reviews from "@/server/repositories/review.repository";

import { resolveImageId } from "./image.service";

async function refreshRating(tx: Transaction, recipeId: number) {
  const aggregate = await reviews.aggregateRecipeRatings(tx, recipeId);
  const rating = Math.round((aggregate._avg.rating ?? 0) * 10) / 10;

  await updateRecipeRating(tx, recipeId, rating, aggregate._count.rating);
}

export async function saveReview(
  tx: Transaction,
  command: CommandOf<"review.save">,
) {
  const existing = command.id ? await reviews.findReview(tx, command.id) : null;

  if (existing && existing.recipeId !== command.recipeId) {
    throw new DomainError("Avaliação pertence a outra receita.");
  }

  const preparationId = existing?.preparationId ?? command.preparationId;
  const date = databaseDate(command.values.date);
  let preparation;

  if (preparationId) {
    preparation = await reviews.findPreparation(tx, preparationId);

    if (preparation.recipeId !== command.recipeId) {
      throw new DomainError("Preparo pertence a outra receita.");
    }

    if (preparation.review && preparation.review.id !== existing?.id) {
      throw new DomainError(
        "Este preparo já foi avaliado. Registre um novo preparo.",
      );
    }

    await reviews.updatePreparationDate(tx, preparation.id, date);
  } else {
    preparation = await reviews.persistPreparation(tx, {
      recipeId: command.recipeId,
      date,
    });
  }

  const review = await reviews.persistReview(
    tx,
    {
      recipeId: command.recipeId,
      preparationId: preparation.id,
      rating: command.values.rating,
      experience: command.values.experience,
      changes: command.values.changes,
      imageId: await resolveImageId(tx, command.values.image),
    },
    existing?.id,
  );

  await refreshRating(tx, command.recipeId);

  return review.id;
}

export async function removeReview(tx: Transaction, id: string) {
  const review = await reviews.deleteReview(tx, id);

  await refreshRating(tx, review.recipeId);
}

export async function savePreparation(
  tx: Transaction,
  command: CommandOf<"preparation.save">,
) {
  const existing = command.id
    ? await reviews.findPreparation(tx, command.id)
    : null;

  if (existing && existing.recipeId !== command.recipeId) {
    throw new DomainError("Preparo pertence a outra receita.");
  }

  const preparation = await reviews.persistPreparation(
    tx,
    {
      recipeId: command.recipeId,
      date: databaseDate(command.date),
      notes: command.notes,
    },
    command.id,
  );

  return preparation.id;
}

export async function removePreparation(tx: Transaction, id: string) {
  const preparation = await reviews.deletePreparation(tx, id);

  await refreshRating(tx, preparation.recipeId);
}
