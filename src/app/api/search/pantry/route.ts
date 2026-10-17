import { DomainError } from "@/lib/errors";
import { errorResponse } from "@/server/http";
import { pantrySearch } from "@/server/services/search.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const value = new URL(request.url).searchParams.get("ingredients") ?? "[]";

    if (value.length > 4000) throw new DomainError("Use até 30 ingredientes.");

    let input;

    try {
      input = JSON.parse(value);
    } catch {
      throw new DomainError("Ingredientes inválidos.");
    }

    return Response.json(await pantrySearch(input), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
