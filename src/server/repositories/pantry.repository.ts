import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { canonical, ingredientPattern } from "@/lib/search-parser";
import { getDb } from "@/server/database/prisma";
import { recipeInclude, recipeDto } from "@/server/repositories/recipe.mapper";

export async function findPantryRecipes(ingredients: string[]) {
  return getDb().$transaction(
    async (tx) => {
      const predicates = Prisma.join(
        ingredients.map(
          (item) => Prisma.sql`i.normalized ~ ${ingredientPattern(item)}`,
        ),
        " OR ",
      );

      const ids = await tx.$queryRaw<{ recipeId: number }[]>(
        Prisma.sql`SELECT i."recipeId" FROM minha_cozinha."Ingredient" i GROUP BY i."recipeId" HAVING SUM(CASE WHEN (${predicates}) THEN 1 ELSE 0 END)>0 ORDER BY SUM(CASE WHEN (${predicates}) THEN 1 ELSE 0 END)::float/COUNT(*) DESC,i."recipeId" DESC LIMIT 100`,
      );

      const rows = await tx.recipe.findMany({
        where: { id: { in: ids.map((r) => r.recipeId) } },
        include: recipeInclude,
      });

      const map = new Map(rows.map((r) => [r.id, r]));

      return ids.flatMap(({ recipeId }) => {
        const row = map.get(recipeId);

        if (!row) return [];

        const recipe = recipeDto(row);
        const matched: string[] = [];
        const missing: string[] = [];

        for (const [index, ingredient] of row.ingredients.entries()) {
          const matches = ingredients.some((item) =>
            new RegExp(
              `\\b${canonical(item).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            ).test(ingredient.normalized),
          );

          (matches ? matched : missing).push(recipe.ingredients[index]);
        }

        return [
          {
            recipe,
            matched,
            missing,
            percentage: Math.round(
              (matched.length / recipe.ingredients.length) * 100,
            ),
          },
        ];
      });
    },
    { isolationLevel: "RepeatableRead", timeout: 15000 },
  );
}
