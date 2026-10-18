"use client";

import RecipeImage from "@/components/common/recipe-image";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import Modal from "@/components/ui/modal";
import { meals } from "@/constants/meals";

import useWeeklyPlannerController from "./weekly-planner.controller";

export default function Planner() {
  const {
    recipeOptions,
    pending,
    slot,
    openMealSelection,
    closeMealSelection,
    selectedDay,
    selectDay,
    calendarDays,
    weekStartLabel,
    weekEndLabel,
    selectedDateLabel,
    selectedRecipeId,
    previousWeek,
    nextWeek,
    generateList,
    saveMeal,
    removeMeal,
    openSelectedRecipe,
  } = useWeeklyPlannerController();

  return (
    <main className="shell page">
      <div className="page-intro planner-intro">
        <div>
          <p className="eyebrow">Organize sua semana</p>
          <h1>Planejamento semanal</h1>
          <p>Uma semana gostosa começa com um pouco de intenção.</p>
        </div>
        <Button icon="bag" onClick={generateList}>
          Gerar lista de compras
        </Button>
      </div>
      <div className="calendar-nav">
        <button aria-label="Semana anterior" onClick={previousWeek}>
          ‹
        </button>
        <strong>
          {weekStartLabel} — {weekEndLabel}
        </strong>
        <button aria-label="Próxima semana" onClick={nextWeek}>
          ›
        </button>
      </div>
      <nav className="planner-days" aria-label="Escolher dia da semana">
        {calendarDays.map((day) => (
          <button
            key={day.id}
            type="button"
            aria-label={day.fullDate}
            aria-pressed={selectedDay === day.index}
            aria-controls="weekly-meals"
            onClick={() => selectDay(day.index)}
          >
            <span>{day.weekday}</span>
            <strong>{day.dayNumber}</strong>
            {day.isToday && <span className="sr-only">Hoje</span>}
          </button>
        ))}
      </nav>
      <p
        className="planner-selected-date"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedDateLabel}
      </p>
      <div className="planner" id="weekly-meals">
        <div className="meal-labels">
          <span></span>
          {meals.map((m) => (
            <strong key={m}>{m}</strong>
          ))}
        </div>
        {calendarDays.map((day) => (
          <div
            className={`day-column${day.index === selectedDay ? " selected-day" : ""}`}
            key={day.key}
          >
            <div className={day.isToday ? "today" : ""}>
              <strong>{day.weekday}</strong>
              <span>{day.dayNumber}</span>
            </div>
            {day.meals.map(({ key, name: meal, recipe, addLabel }) =>
              recipe ? (
                <button
                  className="meal-card"
                  key={meal}
                  onClick={() => openMealSelection(key)}
                  aria-label={`${meal}: ${recipe.title}`}
                >
                  <RecipeImage src={recipe.image} alt="" />
                  <span className="meal-name">{meal}</span>
                  <span className="meal-title">{recipe.title}</span>
                </button>
              ) : (
                <button
                  className="add-meal"
                  key={meal}
                  onClick={() => openMealSelection(key)}
                  aria-label={addLabel}
                >
                  <span className="meal-name">{meal}</span>
                  <span className="meal-placeholder">
                    <Icon name="plus" size={16} /> Adicionar
                  </span>
                </button>
              ),
            )}
          </div>
        ))}
      </div>
      {slot && (
        <Modal title="Adicionar refeição" onClose={closeMealSelection}>
          <form onSubmit={saveMeal}>
            <div className="field">
              <label htmlFor="meal-recipe">Receita</label>
              <select
                id="meal-recipe"
                name="recipe"
                defaultValue={selectedRecipeId ?? ""}
                required
              >
                <option value="" disabled>
                  Escolha uma receita
                </option>
                {recipeOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedRecipeId && (
              <div className="review-actions">
                <Button variant="ghost" onClick={openSelectedRecipe}>
                  Ver receita
                </Button>
                <Button variant="ghost" onClick={removeMeal}>
                  Remover refeição
                </Button>
              </div>
            )}
            <div className="review-actions">
              <Button variant="ghost" onClick={closeMealSelection}>
                Cancelar
              </Button>
              <button
                type="submit"
                disabled={pending}
                className="btn btn-primary"
              >
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
