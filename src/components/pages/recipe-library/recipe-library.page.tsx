"use client";

import EmptyState from "@/components/common/empty-state";
import FilterPanel from "@/components/common/filter-panel";
import RecipeGrid from "@/components/common/recipe-grid";
import SearchBar from "@/components/common/search-bar";
import Icon from "@/components/ui/icon";

import useRecipeLibraryController from "./recipe-library.controller";

type LibraryProps = {
  favoritesOnly?: boolean;
  initialCategory?: string;
};

export default function Library({
  favoritesOnly = false,
  initialCategory,
}: LibraryProps) {
  const {
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
  } = useRecipeLibraryController({ favoritesOnly, initialCategory });

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
        <SearchBar compact value={search} onChange={changeSearch} />
        <button
          className="filter-mobile"
          onClick={toggleFilters}
          aria-expanded={filtersOpen}
        >
          <Icon name="filter" /> Filtros
        </button>
        <select
          value={sort}
          onChange={changeSort}
          aria-label="Ordenar receitas"
        >
          <option value="recent">Mais recentes</option>
          <option value="rating">Melhor avaliadas</option>
          <option value="time">Menor tempo</option>
        </select>
        <div className="view-toggle">
          <button
            className={!list ? "active" : ""}
            onClick={showGrid}
            aria-label="Visualização em grade"
            aria-pressed={!list}
          >
            <Icon name="grid" />
          </button>
          <button
            className={list ? "active" : ""}
            onClick={showList}
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
              onClick={closeFilters}
            >
              Fechar filtros ×
            </button>
          )}
          <FilterPanel
            filters={filters}
            onChange={changeFilters}
            onClear={clearFilters}
          />
        </div>
        <div className="library-results">
          <div className="results-count">
            <strong>{result.total} receitas</strong>
            <span role="status">
              {loading ? "Carregando receitas…" : "na sua coleção"}
            </span>
          </div>
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
            <EmptyState clear={resetSearch} />
          )}
          {result.pages > 1 && (
            <nav className="pagination" aria-label="Páginas de receitas">
              <button
                className="btn btn-soft"
                disabled={page === 1 || loading}
                onClick={previousPage}
              >
                Anterior
              </button>
              <span>
                Página {page} de {result.pages}
              </span>
              <button
                className="btn btn-soft"
                disabled={page >= result.pages || loading}
                onClick={nextPage}
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
