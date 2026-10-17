"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { mutateKitchen } from "@/actions/kitchen.actions";
import type { KitchenCommand } from "@/schemas/kitchen-command.schema";
import type { RecipeFormValues } from "@/schemas/recipe.schema";
import type { ReviewValues } from "@/schemas/review.schema";
import { emptyKitchen, type KitchenState } from "@/types/kitchen";

import type { Kitchen, MutationResult } from "./use-kitchen";

export function useKitchenController(
  initialData: KitchenState = emptyKitchen,
  initialError = "",
) {
  const [state, setState] = useState(initialData);
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  const stateRef = useRef(state);
  const revision = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pendingCount = useRef(0);

  const replace = useCallback((value: KitchenState) => {
    stateRef.current = value;
    setState(value);
  }, []);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (pendingCount.current) return;

      const version = revision.current;

      try {
        const response = await fetch("/api/kitchen", {
          cache: "no-store",
          signal,
        });

        if (!response.ok) throw new Error();

        const value = (await response.json()) as KitchenState;

        if (version === revision.current && !pendingCount.current) {
          replace(value);
          setError("");
        }
      } catch {
        if (!signal?.aborted)
          setError(
            "Não foi possível atualizar os dados. Verifique a conexão com o servidor.",
          );
      }
    },
    [replace],
  );

  useEffect(() => {
    const controller = new AbortController();

    const update = () => {
      if (document.visibilityState === "visible")
        void refresh(controller.signal);
    };

    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);

    const timer = window.setInterval(update, 10000);

    return () => {
      controller.abort();
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const command = useCallback(
    (
      input: KitchenCommand | ((value: KitchenState) => KitchenCommand),
    ): Promise<MutationResult> => {
      revision.current++;
      pendingCount.current++;
      setPending(true);

      const task = queue.current.then(async () => {
        try {
          const result = await mutateKitchen(
            typeof input === "function" ? input(stateRef.current) : input,
          );

          if (!result.ok) {
            setError(result.error);

            return null;
          }

          replace(result.state);
          setError("");

          return { id: result.id, state: result.state };
        } catch {
          setError(
            "A alteração não foi confirmada pelo servidor. Verifique a conexão e atualize os dados antes de tentar novamente.",
          );

          return null;
        } finally {
          pendingCount.current--;
          setPending(pendingCount.current > 0);
        }
      });

      queue.current = task.catch(() => {});

      return task;
    },
    [replace],
  );

  const actions = {
    async toggleFavorite(recipeId: number) {
      await command((s) => ({
        type: "favorite.set",
        recipeId,
        value: !s.favorites.includes(recipeId),
      }));
    },
    async saveRecipe(values: RecipeFormValues, id?: number) {
      const result = await command({ type: "recipe.save", id, values });

      return typeof result?.id === "number" ? { id: result.id } : undefined;
    },
    async saveReview(
      recipeId: number,
      values: ReviewValues,
      id?: string,
      preparationId?: string,
    ) {
      return !!(await command({
        type: "review.save",
        id,
        recipeId,
        preparationId,
        values,
      }));
    },
    async setMeal(key: string, recipeId: number | null) {
      return !!(await command({
        type: "meal.set",
        date: key.slice(0, 10),
        meal: Number(key.slice(11)),
        recipeId,
      }));
    },
    async addShopping(label: string) {
      let listId = stateRef.current.currentListId;

      if (!listId) {
        const result = await command({
          type: "list.save",
          name: "Lista de compras",
        });

        if (!result?.id) return false;

        listId = String(result.id);

        if (!(await command({ type: "list.select", id: listId }))) return false;
      }

      return !!(await command({ type: "shopping.add", listId, label }));
    },
    async clearPurchased() {
      const listId = stateRef.current.currentListId;

      if (listId) await command({ type: "shopping.clear", listId });
    },
    async generateShopping(start: string, end: string) {
      return !!(await command({ type: "shopping.generate", start, end }));
    },
  };

  const value: Kitchen = {
    ...state,
    ...actions,
    command,
    pending,
    error,
    clearError: () => setError(""),
  };

  return { value, refresh };
}
