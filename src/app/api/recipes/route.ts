import { errorResponse } from "@/server/http";
import { listRecipes } from "@/server/services/recipe.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return Response.json(
      await listRecipes(Object.fromEntries(new URL(request.url).searchParams)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
