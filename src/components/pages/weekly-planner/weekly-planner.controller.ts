"use client";

import { useState, type FormEvent } from "react";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import { meals } from "@/constants/meals";
import { monday, isoDate, weekDays } from "@/lib/dates";

export default function useWeeklyPlannerController() {
  const { recipeOptions, plan, setMeal, generateShopping, pending } =
    useKitchen();

  const { openRecipe, navigate } = useKitchenNavigation();
  const [week, setWeek] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(
    () => (new Date().getUTCDay() + 6) % 7,
  );

  const [today] = useState(() => isoDate(new Date()));
  const [start] = useState(() => isoDate(monday()));
  const days = weekDays(start, week);
  const date = (value: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: "UTC" }).format(
      value,
    );

  const calendarDays = days.map((day, index) => ({
    key: day.toISOString(),
    id: isoDate(day),
    index,
    isToday: isoDate(day) === today,
    weekday: date(day, { weekday: "short" }).replace(".", ""),
    dayNumber: date(day, { day: "numeric" }),
    fullDate: date(day, { weekday: "long", day: "numeric", month: "long" }),
    meals: meals.map((meal, mealIndex) => {
      const key = `${isoDate(day)}:${mealIndex}`;

      return {
        key,
        name: meal,
        recipe: recipeOptions.find((recipe) => recipe.id === plan[key]),
        addLabel: `Adicionar ${meal}, ${date(day, { weekday: "long" })}`,
      };
    }),
  }));

  const weekStartLabel = date(days[0], { day: "numeric" });
  const weekEndLabel = date(days[6], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const selectedDateLabel = date(days[selectedDay], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const selectedRecipeId = slot ? plan[slot] : undefined;
  const previousWeek = () => setWeek((value) => value - 1);
  const nextWeek = () => setWeek((value) => value + 1);
  const closeMealSelection = () => setSlot(null);

  const generateList = async () => {
    if (await generateShopping(isoDate(days[0]), isoDate(days[6])))
      navigate("shopping");
  };

  const saveMeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!slot) return;

    const data = new FormData(event.currentTarget);

    if (await setMeal(slot, Number(data.get("recipe")))) setSlot(null);
  };

  const removeMeal = async () => {
    if (slot && (await setMeal(slot, null))) setSlot(null);
  };

  const openSelectedRecipe = () => {
    if (slot)
      openRecipe(recipeOptions.find((recipe) => recipe.id === plan[slot])!);
  };

  return {
    recipeOptions,
    pending,
    slot,
    openMealSelection: setSlot,
    closeMealSelection,
    selectedDay,
    selectDay: setSelectedDay,
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
  };
}
