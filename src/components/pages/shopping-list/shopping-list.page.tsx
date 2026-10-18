"use client";

import RecipeImage from "@/components/common/recipe-image";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import Modal from "@/components/ui/modal";

import useShoppingListController from "./shopping-list.controller";

export default function Shopping() {
  const {
    lists,
    currentListId,
    currentListName,
    clearPurchased,
    pending,
    dialog,
    openDialog,
    closeDialog,
    editing,
    editItem,
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
  } = useShoppingListController();

  return (
    <main className="shell page shopping-page">
      <div className="page-intro planner-intro">
        <div>
          <p className="eyebrow">Tudo à mão</p>
          <h1>Lista de compras</h1>
          <p>Ingredientes de {planned.length} receitas planejadas.</p>
        </div>
        <Button icon="plus" onClick={() => openDialog("add")}>
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
          onChange={selectList}
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
        <button className="text-action" onClick={() => openDialog("new")}>
          Nova lista
        </button>
        {currentListId && (
          <>
            <button
              className="text-action"
              onClick={() => openDialog("rename")}
            >
              Renomear
            </button>
            <button
              className="text-action"
              onClick={() => openDialog("delete")}
            >
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
              <i style={{ width: `${progress}%` }} />
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
                        toggleItem(item.id, event.target.checked)
                      }
                    />
                    <span>
                      <Icon name="check" size={14} />
                    </span>
                    <p>{item.label}</p>
                    <small>{item.recipeTitle}</small>
                  </label>
                  <button
                    className="text-action"
                    onClick={() => editItem(item)}
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
          onClose={closeDialog}
        >
          {dialog === "delete" ? (
            <>
              <p>Excluir esta lista e todos os seus itens?</p>
              <div className="review-actions">
                <Button variant="ghost" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button onClick={deleteList}>Excluir</Button>
              </div>
            </>
          ) : (
            <form onSubmit={saveList}>
              <div className="field">
                <label htmlFor="shopping-value">
                  {dialog === "add" ? "Item" : "Nome da lista"}
                </label>
                <input
                  id="shopping-value"
                  name="value"
                  required
                  maxLength={dialog === "add" ? 300 : 120}
                  defaultValue={dialog === "rename" ? currentListName : ""}
                />
              </div>
              <div className="review-actions">
                <Button variant="ghost" onClick={closeDialog}>
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
        <Modal title="Editar item" onClose={closeEditing}>
          <form onSubmit={saveItem}>
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
              <Button variant="ghost" onClick={deleteItem}>
                Excluir item
              </Button>
              <Button variant="ghost" onClick={closeEditing}>
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
