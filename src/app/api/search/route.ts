import { DomainError } from "@/lib/errors";
import { withRequestLog } from "@/server/http";
import { searchRecipes } from "@/server/services/search.service";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const GET = withRequestLog("/api/search", async (request) => {
  const url = new URL(request.url);
  let filters = {};
  const value = url.searchParams.get("filters");

  if (value) {
    if (value.length > 4000) throw new DomainError("Filtros muito extensos.");

    try {
      filters = JSON.parse(value);
    } catch {
      throw new DomainError("Filtros inválidos.");
    }
  }

  return Response.json(
    await searchRecipes({ ...filters, q: url.searchParams.get("q") ?? "" }),
    { headers: { "Cache-Control": "no-store" } },
  );
});
