"use client";

import CategoryCard from "@/components/common/category-card";
import RecipeCard from "@/components/common/recipe-card";
import RecipeGrid from "@/components/common/recipe-grid";
import RecipeImage from "@/components/common/recipe-image";
import SearchBar from "@/components/common/search-bar";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import SectionHeading from "@/components/ui/section-heading";

import useHomeController from "./home.controller";

export default function Home() {
  const {
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
    changeSearch,
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
  } = useHomeController();

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
            onFocus={showSuggestions}
            onBlur={handleSearchBlur}
          >
            <SearchBar
              value={search}
              onChange={changeSearch}
              onSubmit={submitSearch}
              placeholder={searchPlaceholder}
            />
            {suggestionsOpen && (
              <div className="search-popover">
                <div>
                  <span>Experimente buscar</span>
                  {searchSuggestions.map((item) => (
                    <button key={item} onClick={() => runSearch(item)}>
                      <Icon name="search" size={15} />
                      {item}
                    </button>
                  ))}
                </div>
                <div>
                  <span>Buscas recentes</span>
                  {recentSearchSuggestions.map((item) => (
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
            {popularSearches.map(
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
              <Button onClick={openNewRecipe}>
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
          onAction={openLibrary}
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
            onAction={openLibrary}
          />
          <RecipeGrid
            items={recentRecipes}
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
          onAction={openFavorites}
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
            <Button variant="soft" onClick={openFavorites}>
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
          items={topRatedRecipes}
          onOpen={openRecipe}
          favorites={favorites}
          onFavorite={onFavorite}
        />
      </section>
    </main>
  );
}
