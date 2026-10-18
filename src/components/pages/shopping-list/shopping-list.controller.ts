"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useKitchen } from "@/hooks/use-kitchen";
import type { ShoppingItem } from "@/types/kitchen";

export default function useShoppingListController() {
  const {
    recipes,
    shoppingItems,
    lists,
    currentListId,
    addShopping,
    clearPurchased,
    command,
    pending,
  } = useKitchen();

  const [dialog, setDialog] = useState<
    "add" | "new" | "rename" | "delete" | null
  >(null);

  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const groups = [...new Set(shoppingItems.map((i) => i.group))].map(
    (name) => ({
      name,
      items: shoppingItems
        .filter((item) => item.group === name)
        .map((item) => ({
          ...item,
          recipeTitle:
            recipes.find((recipe) => recipe.id === item.recipeId)?.title ??
            "Lista da cozinha",
        })),
    }),
  );

  const completed = shoppingItems.filter((i) => i.checked).length;
  const total = shoppingItems.length;
  const planned = recipes.filter((r) =>
    shoppingItems.some((i) => i.recipeId === r.id),
  );

  const currentListName = lists.find((list) => list.id === currentListId)?.name;
  const closeDialog = () => setDialog(null);
  const closeEditing = () => setEditing(null);

  const selectList = (event: ChangeEvent<HTMLSelectElement>) => {
    void command({ type: "list.select", id: event.target.value });
  };

  const toggleItem = (id: string, checked: boolean) => {
    void command({ type: "shopping.update", id, checked });
  };

  const deleteList = async () => {
    if (
      currentListId &&
      (await command({ type: "list.delete", id: currentListId }))
    )
      setDialog(null);
  };

  const saveList = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = String(
      new FormData(event.currentTarget).get("value") ?? "",
    ).trim();

    if (!value) return;

    let ok = false;

    if (dialog === "add") ok = await addShopping(value);
    else {
      const result = await command({
        type: "list.save",
        id: dialog === "rename" ? (currentListId ?? undefined) : undefined,
        name: value,
      });

      if (result) {
        ok = true;

        if (dialog === "new" && result.id)
          ok = !!(await command({
            type: "list.select",
            id: String(result.id),
          }));
      }
    }

    if (ok) setDialog(null);
  };

  const saveItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editing) return;

    const form = new FormData(event.currentTarget);

    if (
      await command({
        type: "shopping.update",
        id: editing.id,
        label: String(form.get("label")),
        group: String(form.get("group")),
      })
    )
      setEditing(null);
  };

  const deleteItem = async () => {
    if (editing && (await command({ type: "shopping.delete", id: editing.id })))
      setEditing(null);
  };

  const progress = total ? (completed / total) * 100 : 0;

  return {
    lists,
    currentListId,
    currentListName,
    clearPurchased,
    pending,
    dialog,
    openDialog: setDialog,
    closeDialog,
    editing,
    editItem: setEditing,
    closeEditing,
    groups,
    completed,
    total,
    planned,
    selectList,
    toggleItem,
    deleteList,
    saveList,
    saveItem,
    deleteItem,
    progress,
  };
}
