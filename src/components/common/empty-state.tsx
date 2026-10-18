"use client";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";

type EmptyStateProps = {
  clear: () => void;
};

export default function EmptyState({ clear }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span>
        <Icon name="search" size={32} />
      </span>
      <h2>Nenhuma receita por aqui</h2>
      <p>Tente buscar outro ingrediente ou remover alguns filtros.</p>
      <Button variant="soft" onClick={clear}>
        Limpar busca
      </Button>
    </div>
  );
}
