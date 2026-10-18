import { z } from "zod";

import { DomainError } from "@/lib/errors";
import { withRequestLog } from "@/server/http";
import { recipeDetail } from "@/server/services/recipe.service";

export const dynamic = "force-dynamic";

export const GET = withRequestLog(
  "/api/recipes/[id]",
  async (_request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const result = await recipeDetail(
      z.coerce.number().int().positive().parse(id),
    );

    if (!result) throw new DomainError("Receita não encontrada.", 404);

    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  },
);
