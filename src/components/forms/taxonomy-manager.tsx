"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { useKitchen } from "@/hooks/use-kitchen";
import type { NamedEntity } from "@/types/kitchen";

type TaxonomyManagerProps = {
  kind: "category" | "tag";
  onClose: () => void;
};

export default function TaxonomyManager({
  kind,
  onClose,
}: TaxonomyManagerProps) {
  const { categories, tags, command, pending } = useKitchen();
  const [editing, setEditing] = useState<NamedEntity | null>(null);
  const rows = kind === "category" ? categories : tags;

  return (
    <Modal
      title={kind === "category" ? "Categorias" : "Características"}
      onClose={onClose}
    >
      <ul className="taxonomy-list">
        {rows.map((row) => (
          <li key={row.id}>
            <span>{row.name}</span>
            <button className="text-action" onClick={() => setEditing(row)}>
              Editar
            </button>
            <button
              className="text-action"
              disabled={pending}
              onClick={() =>
                void command({
                  type: kind === "category" ? "category.delete" : "tag.delete",
                  id: row.id,
                })
              }
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
      <form
        key={editing?.id ?? "new"}
        onSubmit={async (event) => {
          event.preventDefault();

          const form = event.currentTarget;
          const name = String(new FormData(form).get("name") ?? "");

          if (
            await command({
              type: kind === "category" ? "category.save" : "tag.save",
              id: editing?.id,
              name,
            })
          ) {
            form.reset();
            setEditing(null);
          }
        }}
      >
        <div className="field">
          <label htmlFor="taxonomy-name">
            {editing ? "Editar nome" : "Adicionar nome"}
          </label>
          <input
            id="taxonomy-name"
            name="name"
            defaultValue={editing?.name ?? ""}
            required
            maxLength={80}
          />
        </div>
        <div className="review-actions">
          <Button
            variant="ghost"
            onClick={() => (editing ? setEditing(null) : onClose())}
          >
            {editing ? "Cancelar edição" : "Fechar"}
          </Button>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
