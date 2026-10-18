"use client";

import RatingStars from "@/components/ui/rating-stars";
import { useKitchen } from "@/hooks/use-kitchen";

type LibraryFilters = {
  category: string;
  difficulty: string;
  maxTime: number;
  temperature: string;
  rating: number;
};

export const defaultLibraryFilters: LibraryFilters = {
  category: "Todas",
  difficulty: "Todas",
  maxTime: 1440,
  temperature: "Todas",
  rating: 0,
};

type FilterPanelProps = {
  filters: LibraryFilters;
  onChange: (next: LibraryFilters) => void;
  onClear: () => void;
};

export default function FilterPanel({
  filters,
  onChange,
  onClear,
}: FilterPanelProps) {
  const { recipeCount, categoryCounts, categories } = useKitchen();

  return (
    <aside className="filter-panel">
      <div className="filter-title">
        <strong>Filtros</strong>
        <button onClick={onClear}>Limpar</button>
      </div>
      <div className="filter-group">
        <label>Categoria</label>
        {["Todas", ...categories.map((c) => c.name)].map((c) => (
          <button
            key={c}
            className={filters.category === c ? "selected" : ""}
            onClick={() => onChange({ ...filters, category: c })}
          >
            {c}
            <span>
              {c === "Todas" ? recipeCount : (categoryCounts[c] ?? 0)}
            </span>
          </button>
        ))}
      </div>
      <div className="filter-group">
        <label>Dificuldade</label>
        <div className="chips">
          {["Fácil", "Médio", "Avançado"].map((item) => (
            <button
              key={item}
              className={filters.difficulty === item ? "selected" : ""}
              onClick={() =>
                onChange({
                  ...filters,
                  difficulty: filters.difficulty === item ? "Todas" : item,
                })
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <label htmlFor="time-filter">Tempo máximo</label>
        <input
          id="time-filter"
          type="range"
          min="5"
          max="1440"
          value={filters.maxTime}
          onChange={(e) =>
            onChange({ ...filters, maxTime: Number(e.target.value) })
          }
        />
        <small>
          {filters.maxTime === 1440
            ? "Todos os tempos"
            : `Até ${filters.maxTime} minutos`}
        </small>
      </div>
      <div className="filter-group">
        <label htmlFor="temperature-filter">Temperatura</label>
        <select
          id="temperature-filter"
          value={filters.temperature}
          onChange={(e) =>
            onChange({ ...filters, temperature: e.target.value })
          }
        >
          <option>Todas</option>
          <option>Quente</option>
          <option>Fria</option>
          <option>Gelada</option>
          <option>Ambiente</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Avaliação mínima</label>
        <RatingStars
          value={filters.rating}
          interactive
          onChange={(value) =>
            onChange({
              ...filters,
              rating: filters.rating === value ? 0 : value,
            })
          }
        />
        <small>
          {filters.rating
            ? `${filters.rating} estrelas ou mais`
            : "Todas as avaliações"}
        </small>
      </div>
    </aside>
  );
}
