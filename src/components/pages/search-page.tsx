"use client";

import { useEffect, useRef, useState } from "react";

import EmptyState from "@/components/common/empty-state";
import PantryResult from "@/components/common/pantry-result";
import RecipeGrid from "@/components/common/recipe-grid";
import SearchBar from "@/components/common/search-bar";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { smartExamples } from "@/constants/search-examples";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import { interpretQuery } from "@/lib/search-filters";
import { parseSearch } from "@/lib/search-parser";
import type { Recipe } from "@/types/recipe";
import type { SearchFilter } from "@/types/search";

type SmartSearchPageProps = {
  initialQuery: string;
  initialMode: "search" | "pantry";
};

export default function SmartSearchPage({
  initialQuery,
  initialMode,
}: SmartSearchPageProps) {
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
              onClick={() => setMode("search")}
              role="tab"
              aria-selected={mode === "search"}
            >
              <Icon name="search" size={17} /> Buscar uma receita
            </button>
            <button
              className={mode === "pantry" ? "active" : ""}
              onClick={() => setMode("pantry")}
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
                onChange={setQuery}
                onSubmit={executeSearch}
                autoFocus
                placeholder="Ex.: Quero algo gelado com morango"
              />
              <div className="suggestion-chips">
                <span>Sugestões</span>
                {smartExamples.slice(0, 4).map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setQuery(item);
                      setSubmittedQuery(item);
                      setFilters(interpretQuery(item));
                    }}
                  >
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
                  onChange={(e) => setPantryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addPantryItem(pantryInput);
                  }}
                  placeholder="Digite um ingrediente e pressione Enter"
                  aria-label="Adicionar ingrediente"
                />
                <Button onClick={() => addPantryItem(pantryInput)}>
                  Adicionar
                </Button>
              </div>
              <div className="pantry-chips">
                {pantryItems.map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      setPantryItems((items) =>
                        items.filter((current) => current !== item),
                      )
                    }
                  >
                    {item}
                    <Icon name="x" size={13} />
                  </button>
                ))}
              </div>
              <div className="quick-pantry">
                <span>Adicionar rápido:</span>
                {["ovos", "queijo", "tomate", "frango"]
                  .filter((item) => !pantryItems.includes(item))
                  .map((item) => (
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
                      onClick={() =>
                        setFilters((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <small>{filter.type}</small>
                      {filter.value}
                      <Icon name="x" size={13} />
                    </button>
                  ))}
                  <button
                    className="add-filter"
                    onClick={() =>
                      setFilters((items) => [
                        ...items,
                        { type: "Característica", value: "vegetariana" },
                      ])
                    }
                  >
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
                onChange={(e) => setSort(e.target.value)}
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
                {pantryMatches
                  .filter((item) => item.percentage >= 50)
                  .map((item) => (
                    <PantryResult
                      key={item.recipe.id}
                      item={item}
                      onOpen={openRecipe}
                      ready
                    />
                  ))}
                <h3>Com mais alguns ingredientes</h3>
                {pantryMatches
                  .filter((item) => item.percentage < 50)
                  .slice(0, 5)
                  .map((item) => (
                    <PantryResult
                      key={item.recipe.id}
                      item={item}
                      onOpen={openRecipe}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                clear={() => setPantryItems(["banana", "aveia", "leite"])}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}
