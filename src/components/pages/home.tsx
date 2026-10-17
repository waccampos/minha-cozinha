"use client";

import { useEffect, useState } from "react";

import CategoryCard from "@/components/common/category-card";
import RecipeCard from "@/components/common/recipe-card";
import RecipeGrid from "@/components/common/recipe-grid";
import RecipeImage from "@/components/common/recipe-image";
import SearchBar from "@/components/common/search-bar";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import SectionHeading from "@/components/ui/section-heading";
import { categories as artwork } from "@/constants/category-artwork";
import { smartExamples, recentSearches } from "@/constants/search-examples";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";

export default function Home() {
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

  return (
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">Seu livro de receitas pessoal</p>
          <h1>
            Receitas para guardar.
            <br />
            <em>Momentos para viver.</em>
          </h1>
          <p className="lead">
            Sua coleção de sabores, memórias e descobertas — cuidadosamente
            organizada em um só lugar.
          </p>
          <div
            className="smart-search-wrap"
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget))
                setSuggestionsOpen(false);
            }}
          >
            <SearchBar
              value={search}
              onChange={setSearch}
              onSubmit={() => search.trim() && runSearch(search)}
              placeholder={smartExamples[placeholderIndex]}
            />
            {suggestionsOpen && (
              <div className="search-popover">
                <div>
                  <span>Experimente buscar</span>
                  {smartExamples.slice(0, 3).map((item) => (
                    <button key={item} onClick={() => runSearch(item)}>
                      <Icon name="search" size={15} />
                      {item}
                    </button>
                  ))}
                </div>
                <div>
                  <span>Buscas recentes</span>
                  {recentSearches.slice(0, 2).map((item) => (
                    <button key={item} onClick={() => runSearch(item)}>
                      <Icon name="clock" size={15} />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="hero-notes">
            <span>Mais buscados:</span>
            {["massa rápida", "gelado com morango", "sem açúcar"].map(
              (item) => (
                <button key={item} onClick={() => runSearch(item)}>
                  {item}
                </button>
              ),
            )}
          </div>
          <button className="pantry-link" onClick={openPantry}>
            <span>
              <Icon name="bag" size={18} />
            </span>
            <strong>O que tenho em casa?</strong> Encontre receitas com seus
            ingredientes <Icon name="chevron" size={15} />
          </button>
        </div>
        {featured ? (
          <button className="hero-photo" onClick={() => openRecipe(featured)}>
            <RecipeImage
              src={featured.image}
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 780px) 100vw, 50vw"
              alt={featured.title}
            />
            <div className="hero-label">
              <span>Receita em destaque</span>
              <strong>{featured.title}</strong>
              <small>
                {featured.time} min · {featured.servings}
              </small>
            </div>
            <span className="hero-arrow">
              <Icon name="chevron" />
            </span>
          </button>
        ) : (
          <div className="hero-photo empty-hero">
            <RecipeImage src="/images/recipe-placeholder.svg" alt="" />
            <div className="hero-label">
              <span>Seu livro começa aqui</span>
              <strong>Guarde sua primeira receita</strong>
              <Button onClick={() => navigate("form")}>
                Adicionar receita
              </Button>
            </div>
          </div>
        )}
      </section>
      <section className="shell section">
        <SectionHeading
          eyebrow="Inspiração do dia"
          title="O que vamos cozinhar hoje?"
          action="Ver biblioteca"
          onAction={() => navigate("library")}
        />
        <div className="categories">
          {categories.map((c) => (
            <CategoryCard
              key={c.name}
              item={c}
              onClick={() => openCategory(c.name)}
            />
          ))}
        </div>
      </section>
      <section className="section tinted">
        <div className="shell">
          <SectionHeading
            eyebrow="Adicionadas por último"
            title="Receitas recentes"
            action="Ver todas"
            onAction={() => navigate("library")}
          />
          <RecipeGrid
            items={recipes.slice(0, 4)}
            onOpen={openRecipe}
            favorites={favorites}
            onFavorite={onFavorite}
          />
        </div>
      </section>
      <section className="shell section">
        <SectionHeading
          eyebrow="Sua seleção"
          title="Favoritas para repetir"
          action="Ver favoritos"
          onAction={() => navigate("favorites")}
        />
        <div className="feature-row">
          {chosen[0] && (
            <RecipeCard
              recipe={chosen[0]}
              onOpen={openRecipe}
              favorite
              onFavorite={onFavorite}
            />
          )}
          <div className="feature-quote">
            <span>“</span>
            <h2>Cozinhar é criar memórias que têm sabor.</h2>
            <p>{favorites.size} receitas esperam por você nos favoritos.</p>
            <Button variant="soft" onClick={() => navigate("favorites")}>
              Abrir coleção
            </Button>
          </div>
          {chosen[1] && (
            <RecipeCard
              recipe={chosen[1]}
              onOpen={openRecipe}
              favorite
              onFavorite={onFavorite}
            />
          )}
        </div>
      </section>
      <section className="shell section">
        <SectionHeading eyebrow="As mais amadas" title="Melhores avaliações" />
        <RecipeGrid
          items={[...recipes]
            .filter((r) => r.reviews > 0)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 4)}
          onOpen={openRecipe}
          favorites={favorites}
          onFavorite={onFavorite}
        />
      </section>
    </main>
  );
}
