"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { defaultLibraryFilters } from "@/components/common/filter-panel";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import type { Recipe } from "@/types/recipe";

type RecipeLibraryControllerOptions = {
  favoritesOnly?: boolean;
  initialCategory?: string;
};

export default function useRecipeLibraryController({
  favoritesOnly = false,
  initialCategory,
}: RecipeLibraryControllerOptions) {
  const { favorites: favoriteIds, toggleFavorite: onFavorite } = useKitchen();

  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  // Polling replaces the array even when the favorite IDs haven't changed.
  const favoritesKey = favoriteIds.join(",");

  const { openRecipe } = useKitchenNavigation();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    ...defaultLibraryFilters,
    category: initialCategory ?? "Todas",
  });

  const [sort, setSort] = useState("recent");
  const [list, setList] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    items: Recipe[];
    total: number;
    pages: number;
  }>({ items: [], total: 0, pages: 0 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        q: search,
        page: String(page),
        maxTime: String(filters.maxTime),
        rating: String(filters.rating),
        sort,
        favorites: String(favoritesOnly),
      });

      if (filters.category !== "Todas")
        params.set("category", filters.category);

      if (filters.difficulty !== "Todas")
        params.set("difficulty", filters.difficulty);

      if (filters.temperature !== "Todas")
        params.set("temperature", filters.temperature);

      try {
        const response = await fetch(`/api/recipes?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        setResult(data);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar as receitas.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [page, search, filters, sort, favoritesOnly, favoritesKey]);

  const results = result.items;

  const changeFilters = (value: typeof filters) => {
    setFilters(value);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeSort = (event: ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value);
    setPage(1);
  };

  const toggleFilters = () => setFiltersOpen(!filtersOpen);
  const closeFilters = () => setFiltersOpen(false);
  const showGrid = () => setList(false);
  const showList = () => setList(true);
  const clearFilters = () => changeFilters(defaultLibraryFilters);

  const resetSearch = () => {
    setSearch("");
    clearFilters();
  };

  const previousPage = () => setPage((value) => value - 1);
  const nextPage = () => setPage((value) => value + 1);

  return {
    onFavorite,
    favorites,
    openRecipe,
    search,
    filters,
    sort,
    list,
    filtersOpen,
    page,
    result,
    loading,
    error,
    results,
    changeFilters,
    changeSearch,
    changeSort,
    toggleFilters,
    closeFilters,
    showGrid,
    showList,
    clearFilters,
    resetSearch,
    previousPage,
    nextPage,
  };
}
