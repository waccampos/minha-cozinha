"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import type { Page } from "@/lib/navigation";

import Navigation from "./navigation";

type ShellProps = {
  children: ReactNode;
  footer: ReactNode;
};

export default function Shell({ children, footer }: ShellProps) {
  const path = usePathname();
  const { navigate } = useKitchenNavigation();
  const page: Page =
    path === "/"
      ? "home"
      : path === "/busca"
        ? "search"
        : path === "/favoritos"
          ? "favorites"
          : path === "/planejamento"
            ? "planner"
            : path === "/compras"
              ? "shopping"
              : "library";

  const cooking = path.endsWith("/cozinhar");

  return (
    <div className={cooking ? "app" : "app app-with-navigation"}>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      {!cooking && <Navigation page={page} navigate={navigate} />}
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      {!cooking && footer}
    </div>
  );
}
