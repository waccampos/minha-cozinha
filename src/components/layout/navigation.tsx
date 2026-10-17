"use client";

import Link from "next/link";
import { useState } from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import type { Page } from "@/lib/navigation";

const links: { label: string; page: Page; href: string }[] = [
  { label: "Início", page: "home", href: "/" },
  { label: "Receitas", page: "library", href: "/receitas" },
  { label: "Favoritos", page: "favorites", href: "/favoritos" },
  { label: "Planejamento", page: "planner", href: "/planejamento" },
  { label: "Compras", page: "shopping", href: "/compras" },
];

export default function Navigation({
  page,
  navigate,
}: {
  page: Page;
  navigate: (page: Page) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="navigation">
      <Link className="brand" href="/" onClick={() => setOpen(false)}>
        <span className="brand-mark">M</span>
        <span>
          Minha <i>Cozinha</i>
        </span>
      </Link>
      <nav
        id="main-navigation"
        aria-label="Navegação principal"
        className={open ? "open" : ""}
      >
        {links.map((link) => {
          const active =
            page === link.page ||
            (link.page === "library" && page === "search");

          return (
            <Link
              key={link.page}
              href={link.href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          className="new-recipe-mobile"
          href="/receitas/nova"
          onClick={() => setOpen(false)}
        >
          Nova receita
        </Link>
      </nav>
      <div className="nav-actions">
        <Button onClick={() => navigate("form")} icon="plus">
          Nova receita
        </Button>
        <button
          className="menu-btn"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "x" : "menu"} />
        </button>
      </div>
    </header>
  );
}
