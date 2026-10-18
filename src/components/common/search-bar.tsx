"use client";

import Icon from "@/components/ui/icon";

type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export default function SearchBar({
  value,
  onChange,
  compact = false,
  onSubmit,
  placeholder,
  autoFocus = false,
}: SearchBarProps) {
  return (
    <form
      className={`search ${compact ? "compact" : ""}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Icon name="search" size={compact ? 19 : 23} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "O que você está com vontade de comer?"}
        aria-label="Pesquisar receitas"
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange("")}
          aria-label="Limpar pesquisa"
        >
          <Icon name="x" size={16} />
        </button>
      )}
      {!compact && (
        <button className="search-submit" type="submit">
          Buscar
        </button>
      )}
    </form>
  );
}
