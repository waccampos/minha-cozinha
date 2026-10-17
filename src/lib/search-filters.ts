import { parseSearch } from "@/lib/search-parser";
import type { SearchFilter } from "@/types/search";

export function interpretQuery(query: string): SearchFilter[] {
  const parsed = parseSearch(query);
  const filters: SearchFilter[] = [];

  for (const value of parsed.include)
    filters.push({ type: "Ingrediente", value });

  for (const value of parsed.exclude) filters.push({ type: "Exclusão", value });

  if (parsed.temperature)
    filters.push({ type: "Temperatura", value: parsed.temperature });

  if (parsed.flavor) filters.push({ type: "Perfil", value: parsed.flavor });

  if (parsed.category)
    filters.push({ type: "Categoria", value: parsed.category });

  if (parsed.maxTime)
    filters.push({ type: "Tempo", value: `Até ${parsed.maxTime} min` });

  return filters;
}
