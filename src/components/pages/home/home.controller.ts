"use client";

import { useEffect, useState, type FocusEvent } from "react";
import { categories as artwork } from "@/constants/category-artwork";
import { smartExamples, recentSearches } from "@/constants/search-examples";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";

export default function useHomeController() {
  const {
    recipes,
    categories: categoryRows,
    favorites: favoriteIds,
    toggleFavorite: onFavorite,
  } = useKitchen();

  const favorites = new Set(favoriteIds);
  const featured = recipes[0];
  const chosen = recipes.filter((r) => favorites.has(r.id));
  const categories = [...categoryRows]
    .sort((a, b) => {
      const ai = artwork.findIndex((c) => c.name === a.name);
      const bi = artwork.findIndex((c) => c.name === b.name);

      return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
    })
    .slice(0, 4)
    .map((c, i) => ({
      ...c,
      icon: String(i + 1).padStart(2, "0"),
      image: artwork.find((a) => a.name === c.name)
        ? `/images/categories/${artwork.find((a) => a.name === c.name)!.icon}.jpg`
        : "/images/recipe-placeholder.svg",
    }));

  const { navigate, openRecipe, runSearch, openPantry, openCategory } =
    useKitchenNavigation();

  const [search, setSearch] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(
      () => setPlaceholderIndex((value) => (value + 1) % smartExamples.length),
      3200,
    );

    return () => window.clearInterval(timer);
  }, []);

  const recentRecipes = recipes.slice(0, 4);
  const topRatedRecipes = [...recipes]
    .filter((recipe) => recipe.reviews > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const searchPlaceholder = smartExamples[placeholderIndex];
  const searchSuggestions = smartExamples.slice(0, 3);
  const recentSearchSuggestions = recentSearches.slice(0, 2);
  const popularSearches = ["massa rápida", "gelado com morango", "sem açúcar"];
  const openLibrary = () => navigate("library");
  const openFavorites = () => navigate("favorites");
  const openNewRecipe = () => navigate("form");
  const showSuggestions = () => setSuggestionsOpen(true);

  const handleSearchBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget))
      setSuggestionsOpen(false);
  };

  const submitSearch = () => {
    if (search.trim()) runSearch(search);
  };

  return {
    onFavorite,
    favorites,
    featured,
    chosen,
    categories,
    openLibrary,
    openFavorites,
    openNewRecipe,
    openRecipe,
    runSearch,
    openPantry,
    openCategory,
    search,
    changeSearch: setSearch,
    searchPlaceholder,
    searchSuggestions,
    recentSearchSuggestions,
    popularSearches,
    suggestionsOpen,
    showSuggestions,
    handleSearchBlur,
    submitSearch,
    recentRecipes,
    topRatedRecipes,
  };
}
