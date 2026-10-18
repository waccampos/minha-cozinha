"use client";

import EmptyState from "@/components/common/empty-state";
import PantryResult from "@/components/common/pantry-result";
import RecipeGrid from "@/components/common/recipe-grid";
import SearchBar from "@/components/common/search-bar";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";

import useSearchController from "./search.controller";

type SmartSearchPageProps = {
  initialQuery: string;
  initialMode: "search" | "pantry";
};

export default function SmartSearchPage({
  initialQuery,
  initialMode,
}: SmartSearchPageProps) {
  const {
    favorites,
    onFavorite,
    openRecipe,
    mode,
    query,
    changeQuery,
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
  } = useSearchController(initialQuery, initialMode);

  return (
    <main className="search-page">
      <section className="search-masthead">
        <div className="shell">
          <p className="eyebrow">Busca inteligente</p>
          <h1>
            {mode === "search"
              ? "O que você quer preparar?"
              : "O que você tem em casa?"}
          </h1>
          <p>
            {mode === "search"
              ? "Descreva sua vontade do seu jeito. Nós organizamos os sabores para você."
              : "Conte os ingredientes disponíveis e descubra o que já pode ir para a mesa."}
          </p>
          <div className="search-mode-tabs" role="tablist">
            <button
              className={mode === "search" ? "active" : ""}
              onClick={showSearch}
              role="tab"
              aria-selected={mode === "search"}
            >
              <Icon name="search" size={17} /> Buscar uma receita
            </button>
            <button
              className={mode === "pantry" ? "active" : ""}
              onClick={showPantry}
              role="tab"
              aria-selected={mode === "pantry"}
            >
              <Icon name="bag" size={17} /> O que tenho em casa?
            </button>
          </div>
          {mode === "search" ? (
            <div className="search-page-box">
              <SearchBar
                value={query}
                onChange={changeQuery}
                onSubmit={executeSearch}
                autoFocus
                placeholder="Ex.: Quero algo gelado com morango"
              />
              <div className="suggestion-chips">
                <span>Sugestões</span>
                {searchSuggestions.map((item) => (
                  <button key={item} onClick={() => selectExample(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pantry-entry">
              <div className="pantry-input">
                <Icon name="plus" />
                <input
                  ref={pantryRef}
                  value={pantryInput}
                  onChange={changePantryInput}
                  onKeyDown={handlePantryKeyDown}
                  placeholder="Digite um ingrediente e pressione Enter"
                  aria-label="Adicionar ingrediente"
                />
                <Button onClick={submitPantryItem}>Adicionar</Button>
              </div>
              <div className="pantry-chips">
                {pantryItems.map((item) => (
                  <button key={item} onClick={() => removePantryItem(item)}>
                    {item}
                    <Icon name="x" size={13} />
                  </button>
                ))}
              </div>
              <div className="quick-pantry">
                <span>Adicionar rápido:</span>
                {quickIngredients.map((item) => (
                  <button key={item} onClick={() => addPantryItem(item)}>
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="shell search-content">
        {mode === "search" ? (
          <>
            <div className="interpreted-row">
              <div>
                <p className="eyebrow">Entendemos seu pedido</p>
                <h2>
                  {submittedQuery
                    ? `“${submittedQuery}”`
                    : "Comece descrevendo sua vontade"}
                </h2>
              </div>
              {filters.length > 0 && (
                <div className="interpreted-filters">
                  {filters.map((filter, index) => (
                    <button
                      key={`${filter.type}-${filter.value}`}
                      onClick={() => removeFilter(index)}
                    >
                      <small>{filter.type}</small>
                      {filter.value}
                      <Icon name="x" size={13} />
                    </button>
                  ))}
                  <button className="add-filter" onClick={addVegetarianFilter}>
                    <Icon name="plus" size={14} /> filtro
                  </button>
                </div>
              )}
            </div>
            <div className="results-header">
              <div>
                <strong>{shown.length} receitas encontradas</strong>
              </div>
              <select
                value={sort}
                onChange={changeSort}
                aria-label="Ordenar resultados"
              >
                <option value="relevance">Mais relevantes</option>
                <option value="rating">Melhor avaliadas</option>
              </select>
            </div>
            {loading && <p role="status">Buscando receitas…</p>}
            {searchError && (
              <p role="alert" className="field-error">
                {searchError}
              </p>
            )}
            {submittedQuery &&
              !loading &&
              !searchError &&
              shown.length === 0 && (
                <p role="status">
                  Nenhuma receita encontrada com esses filtros.
                </p>
              )}
            {submittedQuery ? (
              <RecipeGrid
                items={shown}
                onOpen={openRecipe}
                favorites={favorites}
                onFavorite={onFavorite}
                reasons={reasons}
              />
            ) : (
              <div className="search-welcome">
                <Icon name="search" size={30} />
                <h2>Busque como você fala</h2>
                <p>
                  Ingredientes, temperatura, tempo e preferências podem fazer
                  parte da mesma frase.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {pantryError && (
              <p role="alert" className="field-error">
                {pantryError}
              </p>
            )}
            <div className="pantry-summary">
              <div>
                <p className="eyebrow">Seu inventário</p>
                <h2>{pantryItems.length} ingredientes disponíveis</h2>
              </div>
              <p>
                Calculamos as melhores combinações considerando os ingredientes
                principais de cada receita.
              </p>
            </div>
            {pantryMatches.length ? (
              <div className="pantry-results">
                <h3>Você já pode preparar</h3>
                {readyMatches.map((item) => (
                  <PantryResult
                    key={item.recipe.id}
                    item={item}
                    onOpen={openRecipe}
                    ready
                  />
                ))}
                <h3>Com mais alguns ingredientes</h3>
                {partialMatches.map((item) => (
                  <PantryResult
                    key={item.recipe.id}
                    item={item}
                    onOpen={openRecipe}
                  />
                ))}
              </div>
            ) : (
              <EmptyState clear={resetPantry} />
            )}
          </>
        )}
      </section>
    </main>
  );
}
