import { z } from "zod";

import { DomainError } from "@/lib/errors";
import { errorResponse } from "@/server/http";
import { recipeDetail } from "@/server/services/recipe.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await recipeDetail(
      z.coerce.number().int().positive().parse(id),
    );

    if (!result) throw new DomainError("Receita não encontrada.", 404);

    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
