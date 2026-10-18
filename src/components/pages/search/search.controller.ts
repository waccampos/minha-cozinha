"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useKitchen } from "@/hooks/use-kitchen";
import { smartExamples } from "@/constants/search-examples";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import { interpretQuery } from "@/lib/search-filters";
import { parseSearch } from "@/lib/search-parser";
import type { Recipe } from "@/types/recipe";
import type { SearchFilter } from "@/types/search";

export default function useSearchController(
  initialQuery: string,
  initialMode: "search" | "pantry",
) {
  const {
    recipes,
    favorites: favoriteIds,
    toggleFavorite: onFavorite,
  } = useKitchen();

  const favorites = new Set(favoriteIds);
  const { openRecipe } = useKitchenNavigation();
  const [mode, setMode] = useState<"search" | "pantry">(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilter[]>(() =>
    interpretQuery(initialQuery),
  );

  const [sort, setSort] = useState("relevance");
  const [pantryItems, setPantryItems] = useState(["banana", "aveia", "leite"]);
  const [pantryInput, setPantryInput] = useState("");

  const pantryRef = useRef<HTMLInputElement>(null);

  const executeSearch = () => {
    const next = interpretQuery(query);
    setFilters(next);
    setSubmittedQuery(query);
  };

  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (!submittedQuery) return;

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setSearchError("");

      const structured = {
        include: filters
          .filter((f) => f.type === "Ingrediente")
          .map((f) => f.value),
        exclude: filters
          .filter((f) => f.type === "Exclusão")
          .map((f) => f.value),
        maxTime:
          Number(
            filters.find((f) => f.type === "Tempo")?.value.match(/\d+/)?.[0],
          ) || undefined,
        temperature: filters.find((f) => f.type === "Temperatura")?.value,
        categories: filters
          .filter((f) => f.type === "Categoria")
          .map((f) => f.value),
        flavor: filters.find((f) => f.type === "Perfil")?.value,
      };

      try {
        const terms = [
          parseSearch(submittedQuery).terms,
          ...filters
            .filter((f) => f.type === "Característica")
            .map((f) => f.value),
        ]
          .join(" ")
          .trim();

        const params = new URLSearchParams({
          q: terms,
          filters: JSON.stringify(structured),
        });

        const response = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        setResults(data.recipes);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchError(
            error instanceof Error
              ? error.message
              : "Não foi possível pesquisar.",
          );
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [submittedQuery, filters]);

  const shown = [...results].sort((a, b) =>
    sort === "rating" ? b.rating - a.rating : 0,
  );

  const reasons = Object.fromEntries(
    shown.map((recipe) => [recipe.id, "Combina com seu pedido"]),
  );

  const addPantryItem = (value: string) => {
    const clean = value.trim().toLowerCase();

    if (clean && !pantryItems.includes(clean))
      setPantryItems((items) => [...items, clean]);

    setPantryInput("");
    pantryRef.current?.focus();
  };

  const [pantryMatches, setPantryMatches] = useState<
    {
      recipe: Recipe;
      matched: string[];
      missing: string[];
      percentage: number;
    }[]
  >([]);

  const [pantryError, setPantryError] = useState("");

  useEffect(() => {
    if (mode !== "pantry") return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/pantry?${new URLSearchParams({ ingredients: JSON.stringify(pantryItems) })}`,
          { signal: controller.signal, cache: "no-store" },
        );

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        setPantryMatches(data);
        setPantryError("");
      } catch (cause) {
        if (!controller.signal.aborted)
          setPantryError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível consultar os ingredientes.",
          );
      }
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [pantryItems, mode, recipes]);

  const selectExample = (value: string) => {
    setQuery(value);
    setSubmittedQuery(value);
    setFilters(interpretQuery(value));
  };

  const showSearch = () => setMode("search");
  const showPantry = () => setMode("pantry");
  const changePantryInput = (event: ChangeEvent<HTMLInputElement>) =>
    setPantryInput(event.target.value);

  const handlePantryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") addPantryItem(pantryInput);
  };

  const submitPantryItem = () => addPantryItem(pantryInput);
  const removePantryItem = (item: string) =>
    setPantryItems((items) => items.filter((current) => current !== item));

  const removeFilter = (index: number) =>
    setFilters((items) => items.filter((_, itemIndex) => itemIndex !== index));

  const addVegetarianFilter = () =>
    setFilters((items) => [
      ...items,
      { type: "Característica", value: "vegetariana" },
    ]);

  const changeSort = (event: ChangeEvent<HTMLSelectElement>) =>
    setSort(event.target.value);

  const resetPantry = () => setPantryItems(["banana", "aveia", "leite"]);
  const searchSuggestions = smartExamples.slice(0, 4);
  const readyMatches = pantryMatches.filter((item) => item.percentage >= 50);
  const partialMatches = pantryMatches
    .filter((item) => item.percentage < 50)
    .slice(0, 5);

  const quickIngredients = ["ovos", "queijo", "tomate", "frango"].filter(
    (item) => !pantryItems.includes(item),
  );

  return {
    favorites,
    onFavorite,
    openRecipe,
    mode,
    query,
    changeQuery: setQuery,
    submittedQuery,
    filters,
    sort,
    pantryItems,
    pantryInput,
    pantryRef,
    executeSearch,
    shown,
    reasons,
    addPantryItem,
    pantryMatches,
    pantryError,
    loading,
    searchError,
    selectExample,
    showSearch,
    showPantry,
    changePantryInput,
    handlePantryKeyDown,
    submitPantryItem,
    removePantryItem,
    removeFilter,
    addVegetarianFilter,
    changeSort,
    resetPantry,
    readyMatches,
    partialMatches,
    quickIngredients,
    searchSuggestions,
  };
}
