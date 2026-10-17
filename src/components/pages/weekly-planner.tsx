"use client";

import { useState } from "react";

import RecipeImage from "@/components/common/recipe-image";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import Modal from "@/components/ui/modal";
import { meals } from "@/constants/meals";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import { monday, isoDate, weekDays } from "@/lib/dates";

export default function Planner() {
  const { recipeOptions, plan, setMeal, generateShopping, pending } =
    useKitchen();

  const { openRecipe, navigate } = useKitchenNavigation();
  const [week, setWeek] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [start] = useState(() => isoDate(monday()));
  const days = weekDays(start, week);
  const date = (value: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: "UTC" }).format(
      value,
    );

  return (
    <main className="shell page">
      <div className="page-intro planner-intro">
        <div>
          <p className="eyebrow">Organize sua semana</p>
          <h1>Planejamento semanal</h1>
          <p>Uma semana gostosa começa com um pouco de intenção.</p>
        </div>
        <Button
          icon="bag"
          onClick={async () => {
            if (await generateShopping(isoDate(days[0]), isoDate(days[6])))
              navigate("shopping");
          }}
        >
          Gerar lista de compras
        </Button>
      </div>
      <div className="calendar-nav">
        <button
          aria-label="Semana anterior"
          onClick={() => setWeek((value) => value - 1)}
        >
          ‹
        </button>
        <strong>
          {date(days[0], { day: "numeric" })} —{" "}
          {date(days[6], { day: "numeric", month: "long", year: "numeric" })}
        </strong>
        <button
          aria-label="Próxima semana"
          onClick={() => setWeek((value) => value + 1)}
        >
          ›
        </button>
      </div>
      <div className="planner">
        <div className="meal-labels">
          <span></span>
          {meals.map((m) => (
            <strong key={m}>{m}</strong>
          ))}
        </div>
        {days.map((day, i) => (
          <div className="day-column" key={day.toISOString()}>
            <div className={i === 0 ? "today" : ""}>
              <strong>
                {date(day, { weekday: "short" }).replace(".", "")}
              </strong>
              <span>{date(day, { day: "numeric" })}</span>
            </div>
            {meals.map((meal, j) => {
              const key = `${isoDate(day)}:${j}`;
              const recipe = recipeOptions.find((r) => r.id === plan[key]);

              return recipe ? (
                <button
                  className="meal-card"
                  key={meal}
                  onClick={() => setSlot(key)}
                  aria-label={`${meal}: ${recipe.title}`}
                >
                  <RecipeImage src={recipe.image} alt="" />
                  <span>{recipe.title}</span>
                </button>
              ) : (
                <button
                  className="add-meal"
                  key={meal}
                  onClick={() => setSlot(key)}
                  aria-label={`Adicionar ${meal}, ${date(day, { weekday: "long" })}`}
                >
                  <Icon name="plus" size={16} /> Adicionar
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {slot && (
        <Modal title="Adicionar refeição" onClose={() => setSlot(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              const data = new FormData(e.currentTarget);

              if (await setMeal(slot, Number(data.get("recipe"))))
                setSlot(null);
            }}
          >
            <div className="field">
              <label htmlFor="meal-recipe">Receita</label>
              <select
                id="meal-recipe"
                name="recipe"
                defaultValue={plan[slot] ?? ""}
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
            {plan[slot] && (
              <div className="review-actions">
                <Button
                  variant="ghost"
                  onClick={() =>
                    openRecipe(recipeOptions.find((r) => r.id === plan[slot])!)
                  }
                >
                  Ver receita
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (await setMeal(slot, null)) setSlot(null);
                  }}
                >
                  Remover refeição
                </Button>
              </div>
            )}
            <div className="review-actions">
              <Button variant="ghost" onClick={() => setSlot(null)}>
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
