import { withRequestLog } from "@/server/http";
import { listRecipes } from "@/server/services/recipe.service";

export const dynamic = "force-dynamic";

export const GET = withRequestLog("/api/recipes", async (request) => {
  return Response.json(
    await listRecipes(Object.fromEntries(new URL(request.url).searchParams)),
    { headers: { "Cache-Control": "no-store" } },
  );
});
