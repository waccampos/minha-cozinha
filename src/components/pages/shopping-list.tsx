"use client";

import { useState } from "react";

import RecipeImage from "@/components/common/recipe-image";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import Modal from "@/components/ui/modal";
import { useKitchen } from "@/hooks/use-kitchen";
import type { ShoppingItem } from "@/types/kitchen";

export default function Shopping() {
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
    (name) => ({ name, items: shoppingItems.filter((i) => i.group === name) }),
  );

  const completed = shoppingItems.filter((i) => i.checked).length;
  const total = shoppingItems.length;
  const planned = recipes.filter((r) =>
    shoppingItems.some((i) => i.recipeId === r.id),
  );

  return (
    <main className="shell page shopping-page">
      <div className="page-intro planner-intro">
        <div>
          <p className="eyebrow">Tudo à mão</p>
          <h1>Lista de compras</h1>
          <p>Ingredientes de {planned.length} receitas planejadas.</p>
        </div>
        <Button icon="plus" onClick={() => setDialog("add")}>
          Adicionar item
        </Button>
      </div>
      <div className="list-toolbar">
        <label htmlFor="shopping-list-select" className="sr-only">
          Lista de compras
        </label>
        <select
          id="shopping-list-select"
          value={currentListId ?? ""}
          disabled={pending}
          onChange={(e) =>
            void command({ type: "list.select", id: e.target.value })
          }
        >
          <option value="" disabled>
            Escolha uma lista
          </option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
        <button className="text-action" onClick={() => setDialog("new")}>
          Nova lista
        </button>
        {currentListId && (
          <>
            <button className="text-action" onClick={() => setDialog("rename")}>
              Renomear
            </button>
            <button className="text-action" onClick={() => setDialog("delete")}>
              Excluir lista
            </button>
          </>
        )}
      </div>
      <div className="shopping-layout">
        <div className="shopping-list">
          <div className="shopping-progress">
            <span>
              <strong>{completed}</strong> de {total} itens
            </span>
            <div
              role="progressbar"
              aria-label="Itens comprados"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={Math.max(total, 1)}
            >
              <i
                style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          {!total && (
            <p>
              Sua lista está vazia. Adicione itens ou gere uma lista no
              planejamento.
            </p>
          )}
          {groups.map((group) => (
            <section key={group.name}>
              <div className="shopping-group-title">
                <h2>{group.name}</h2>
                <span>{group.items.length} itens</span>
              </div>
              {group.items.map((item) => (
                <div key={item.id} className="shopping-item-row">
                  <label className={item.checked ? "bought" : ""}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      disabled={pending}
                      onChange={(event) =>
                        void command({
                          type: "shopping.update",
                          id: item.id,
                          checked: event.target.checked,
                        })
                      }
                    />
                    <span>
                      <Icon name="check" size={14} />
                    </span>
                    <p>{item.label}</p>
                    <small>
                      {recipes.find((r) => r.id === item.recipeId)?.title ??
                        "Lista da cozinha"}
                    </small>
                  </label>
                  <button
                    className="text-action"
                    onClick={() => setEditing(item)}
                    aria-label={`Editar ${item.label}`}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                </div>
              ))}
            </section>
          ))}
        </div>
        <aside className="shopping-summary">
          <p className="eyebrow">Nesta lista</p>
          <h3>Receitas planejadas</h3>
          {planned.map((r) => (
            <div key={r.id}>
              <RecipeImage src={r.image} alt="" />
              <span>
                {r.title}
                <small>{r.ingredients.length} ingredientes</small>
              </span>
            </div>
          ))}
          <Button variant="soft" onClick={clearPurchased}>
            Limpar comprados
          </Button>
        </aside>
      </div>
      {dialog && (
        <Modal
          title={
            dialog === "add"
              ? "Adicionar item"
              : dialog === "new"
                ? "Nova lista"
                : dialog === "rename"
                  ? "Renomear lista"
                  : "Excluir lista"
          }
          onClose={() => setDialog(null)}
        >
          {dialog === "delete" ? (
            <>
              <p>Excluir esta lista e todos os seus itens?</p>
              <div className="review-actions">
                <Button variant="ghost" onClick={() => setDialog(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (
                      currentListId &&
                      (await command({
                        type: "list.delete",
                        id: currentListId,
                      }))
                    )
                      setDialog(null);
                  }}
                >
                  Excluir
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={async (event) => {
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
                    id:
                      dialog === "rename"
                        ? (currentListId ?? undefined)
                        : undefined,
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
              }}
            >
              <div className="field">
                <label htmlFor="shopping-value">
                  {dialog === "add" ? "Item" : "Nome da lista"}
                </label>
                <input
                  id="shopping-value"
                  name="value"
                  required
                  maxLength={dialog === "add" ? 300 : 120}
                  defaultValue={
                    dialog === "rename"
                      ? lists.find((l) => l.id === currentListId)?.name
                      : ""
                  }
                />
              </div>
              <div className="review-actions">
                <Button variant="ghost" onClick={() => setDialog(null)}>
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
          )}
        </Modal>
      )}
      {editing && (
        <Modal title="Editar item" onClose={() => setEditing(null)}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();

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
            }}
          >
            <div className="field">
              <label htmlFor="item-label">Item</label>
              <input
                id="item-label"
                name="label"
                defaultValue={editing.label}
                required
                maxLength={300}
              />
              <label htmlFor="item-group">Grupo</label>
              <input
                id="item-group"
                name="group"
                defaultValue={editing.group}
                required
                maxLength={80}
              />
            </div>
            <div className="review-actions">
              <Button
                variant="ghost"
                onClick={async () => {
                  if (
                    await command({ type: "shopping.delete", id: editing.id })
                  )
                    setEditing(null);
                }}
              >
                Excluir item
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
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
