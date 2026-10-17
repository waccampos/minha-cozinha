"use client";

import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/common/empty-state";
import FilterPanel, {
  defaultLibraryFilters,
} from "@/components/common/filter-panel";
import RecipeGrid from "@/components/common/recipe-grid";
import SearchBar from "@/components/common/search-bar";
import Icon from "@/components/ui/icon";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import type { Recipe } from "@/types/recipe";

export default function Library({
  favoritesOnly = false,
  initialCategory,
}: {
  favoritesOnly?: boolean;
  initialCategory?: string;
}) {
  const { favorites: favoriteIds, toggleFavorite: onFavorite } = useKitchen();

  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);

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
  }, [page, search, filters, sort, favoritesOnly, favoriteIds]);

  const results = result.items;

  const changeFilters = (value: typeof filters) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <main className="shell page">
      <div className="page-intro">
        <p className="eyebrow">
          {favoritesOnly ? "Sua coleção especial" : "Todas as receitas"}
        </p>
        <h1>
          {favoritesOnly ? "Receitas favoritas" : "Biblioteca de receitas"}
        </h1>
        <p>
          {favoritesOnly
            ? "Os sabores que conquistaram um lugar à mesa — e no coração."
            : "Explore sua coleção, redescubra sabores e encontre a inspiração certa."}
        </p>
      </div>
      <div className="toolbar">
        <SearchBar
          compact
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <button
          className="filter-mobile"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
        >
          <Icon name="filter" /> Filtros
        </button>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          aria-label="Ordenar receitas"
        >
          <option value="recent">Mais recentes</option>
          <option value="rating">Melhor avaliadas</option>
          <option value="time">Menor tempo</option>
        </select>
        <div className="view-toggle">
          <button
            className={!list ? "active" : ""}
            onClick={() => setList(false)}
            aria-label="Visualização em grade"
            aria-pressed={!list}
          >
            <Icon name="grid" />
          </button>
          <button
            className={list ? "active" : ""}
            onClick={() => setList(true)}
            aria-label="Visualização em lista"
            aria-pressed={list}
          >
            <Icon name="list" />
          </button>
        </div>
      </div>
      <div className="library-layout">
        <div className={filtersOpen ? "mobile-filter-open" : ""}>
          {filtersOpen && (
            <button
              className="close-filters text-action"
              onClick={() => setFiltersOpen(false)}
            >
              Fechar filtros ×
            </button>
          )}
          <FilterPanel
            filters={filters}
            onChange={changeFilters}
            onClear={() => changeFilters(defaultLibraryFilters)}
          />
        </div>
        <div className="library-results">
          <div className="results-count">
            <strong>{result.total} receitas</strong>
            <span>na sua coleção</span>
          </div>
          {loading && <p role="status">Carregando receitas…</p>}
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          {results.length ? (
            <RecipeGrid
              items={results}
              onOpen={openRecipe}
              list={list}
              favorites={favorites}
              onFavorite={onFavorite}
            />
          ) : (
            <EmptyState
              clear={() => {
                setSearch("");
                changeFilters(defaultLibraryFilters);
              }}
            />
          )}
          {result.pages > 1 && (
            <nav className="pagination" aria-label="Páginas de receitas">
              <button
                className="btn btn-soft"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>
                Página {page} de {result.pages}
              </span>
              <button
                className="btn btn-soft"
                disabled={page >= result.pages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </button>
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
