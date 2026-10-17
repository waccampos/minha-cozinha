import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { ingredientPattern } from "@/lib/search-parser";
import { getDb } from "@/server/database/prisma";
import { recipeDto, recipeInclude } from "@/server/repositories/recipe.mapper";
import type { ParsedSearch } from "@/types/search";

export async function findMatchingRecipes(parsed: ParsedSearch) {
  return getDb().$transaction(
    async (db) => {
      // Escapamento é para LIKE, além da parametrização SQL do Prisma.
      const pattern = (s: string) => `%${s.replace(/[\\%_]/g, "\\$&")}%`;
      const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];

      for (const word of parsed.exclude)
        conditions.push(
          Prisma.sql`NOT EXISTS (SELECT 1 FROM minha_cozinha."Ingredient" i WHERE i."recipeId"=r.id AND i.normalized ~ ${ingredientPattern(word)})`,
        );

      for (const word of parsed.include)
        conditions.push(
          Prisma.sql`EXISTS (SELECT 1 FROM minha_cozinha."Ingredient" i WHERE i."recipeId"=r.id AND i.normalized ~ ${ingredientPattern(word)})`,
        );

      if (parsed.maxTime)
        conditions.push(Prisma.sql`r.time <= ${parsed.maxTime}`);

      if (parsed.temperature)
        conditions.push(Prisma.sql`r.temperature = ${parsed.temperature}`);

      if (parsed.flavor)
        conditions.push(Prisma.sql`r.flavor = ${parsed.flavor}`);

      for (const category of parsed.categories)
        conditions.push(
          Prisma.sql`EXISTS (SELECT 1 FROM minha_cozinha."RecipeCategory" rc JOIN minha_cozinha."Category" c ON c.id=rc."categoryId" WHERE rc."recipeId"=r.id AND c.name=${category})`,
        );

      let textPredicate = Prisma.sql`TRUE`;
      let score = Prisma.sql`0`;

      if (parsed.terms) {
        const extensions = await db.$queryRaw<
          { schema: string }[]
        >`SELECT n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm'`;

        const fts = Prisma.sql`to_tsvector('simple',r."searchText") @@ plainto_tsquery('simple',${parsed.terms})`;
        score = Prisma.sql`ts_rank(to_tsvector('simple',r."searchText"),plainto_tsquery('simple',${parsed.terms}))`;

        if (extensions[0]) {
          const namespace = Prisma.raw(
            '"' + extensions[0].schema.replace(/"/g, '""') + '"',
          );

          await db.$executeRaw`SELECT set_config('pg_trgm.word_similarity_threshold','0.35',true)`;
          textPredicate = Prisma.sql`(${fts} OR r."searchText" OPERATOR(${namespace}.%>) ${parsed.terms})`;
          score = Prisma.sql`(${score}+${namespace}.word_similarity(${parsed.terms},r."searchText"))`;
        } else
          textPredicate = Prisma.sql`(${fts} OR r."searchText" LIKE ${pattern(parsed.terms)})`;
      }

      const ids = await db.$queryRaw<{ id: number }[]>(
        Prisma.sql`SELECT r.id FROM minha_cozinha."Recipe" r WHERE ${Prisma.join(conditions, " AND ")} AND ${textPredicate} ORDER BY ${score} DESC,r."createdAt" DESC LIMIT 100`,
      );

      const rows = await db.recipe.findMany({
        where: { id: { in: ids.map((r) => r.id) } },
        include: recipeInclude,
      });

      const byId = new Map(rows.map((r) => [r.id, r]));

      return {
        parsed,
        recipes: ids.flatMap((r) => {
          const row = byId.get(r.id);

          return row ? [recipeDto(row)] : [];
        }),
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 15000 },
  );
}
