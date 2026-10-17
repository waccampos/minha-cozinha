"use client";

import Link from "next/link";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import type { Page } from "@/lib/navigation";

const links: {
  label: string;
  mobileLabel?: string;
  icon: string;
  page: Page;
  href: string;
}[] = [
  { label: "Início", icon: "home", page: "home", href: "/" },
  { label: "Receitas", icon: "grid", page: "library", href: "/receitas" },
  { label: "Favoritos", icon: "heart", page: "favorites", href: "/favoritos" },
  {
    label: "Planejamento",
    mobileLabel: "Semana",
    icon: "calendar",
    page: "planner",
    href: "/planejamento",
  },
  { label: "Compras", icon: "bag", page: "shopping", href: "/compras" },
];

export default function Navigation({
  page,
  navigate,
}: {
  page: Page;
  navigate: (page: Page) => void;
}) {
  const isActive = (target: Page) =>
    page === target || (target === "library" && page === "search");

  return (
    <>
      <header className="navigation">
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          <span>
            Minha <i>Cozinha</i>
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          {links.map((link) => (
            <Link
              key={link.page}
              href={link.href}
              className={isActive(link.page) ? "active" : ""}
              aria-current={isActive(link.page) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Button onClick={() => navigate("form")} icon="plus">
            Nova receita
          </Button>
          <Link
            className="mobile-add-recipe"
            href="/receitas/nova"
            aria-label="Adicionar nova receita"
          >
            <Icon name="plus" size={19} />
            <span>Receita</span>
          </Link>
        </div>
      </header>
      <nav className="mobile-navigation" aria-label="Navegação principal móvel">
        {links.map((link) => (
          <Link
            key={link.page}
            href={link.href}
            className={isActive(link.page) ? "active" : ""}
            aria-label={link.label}
            aria-current={isActive(link.page) ? "page" : undefined}
          >
            <span className="mobile-navigation-icon">
              <Icon name={link.icon} size={21} />
            </span>
            <span>{link.mobileLabel ?? link.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
