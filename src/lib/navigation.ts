export type Page =
  | "home"
  | "search"
  | "library"
  | "detail"
  | "form"
  | "review"
  | "favorites"
  | "planner"
  | "shopping"
  | "cooking";

export function pageHref(page: Page, id?: number): string {
  const routes = {
    home: "/",
    search: "/busca",
    library: "/receitas",
    favorites: "/favoritos",
    planner: "/planejamento",
    shopping: "/compras",
    form: id ? `/receitas/${id}/editar` : "/receitas/nova",
    detail: `/receitas/${id}`,
    review: `/receitas/${id}/avaliar`,
    cooking: `/receitas/${id}/cozinhar`,
  };

  return routes[page];
}
