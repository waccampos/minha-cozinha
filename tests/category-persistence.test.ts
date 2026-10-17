import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";

import type { Prisma } from "../src/generated/prisma/client";
import { commandSchema } from "../src/schemas/kitchen-command.schema";
import { recipeListInput } from "../src/schemas/recipe-list.schema";
import { getDb, type Transaction } from "../src/server/database/prisma";
import { snapshot } from "../src/server/repositories/kitchen.repository";
import { findRecipePage } from "../src/server/repositories/recipe.repository";
import {
  recipeDto,
  recipeInclude,
} from "../src/server/repositories/recipe.mapper";
import { saveRecipe } from "../src/server/services/recipe.service";
import { searchRecipes } from "../src/server/services/search.service";
import { saveCategory } from "../src/server/services/taxonomy.service";

import { recipeValues } from "./fixtures/recipe";

function fixture() {
  const categories = [
    { id: 1, name: "Saudáveis" },
    { id: 2, name: "Sobremesas" },
  ];

  let links = [1];
  let searchText = "";
  let writes = 0;

  const row = (): Prisma.RecipeGetPayload<{
    include: typeof recipeInclude;
  }> => ({
    id: 7,
    title: recipeValues.title,
    description: recipeValues.description,
    time: 20,
    servings: "2 porções",
    difficulty: "Fácil",
    temperature: "Gelada",
    flavor: "Doce",
    notes: "",
    searchText,
    rating: 0,
    reviewCount: 0,
    imageId: null,
    image: null,
    favorite: null,
    ingredients: [],
    steps: [],
    tags: [],
    createdAt: new Date("2026-10-17T12:00:00Z"),
    updatedAt: new Date("2026-10-17T12:00:00Z"),
    categories: categories
      .filter((c) => links.includes(c.id))
      .map((category) => ({
        recipeId: 7,
        categoryId: category.id,
        category,
      })),
  });

  const empty = {
    findMany: async () => [],
    deleteMany: async () => {},
    createMany: async () => {},
  };

  const tx = {
    category: {
      findMany: async (args: { where?: { name: { in: string[] } } }) =>
        categories
          .filter((c) => !args.where || args.where.name.in.includes(c.name))
          .map((c) => ({
            ...c,
            _count: { recipes: links.includes(c.id) ? 1 : 0 },
          })),
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: { name: string };
      }) => {
        const category = categories.find((c) => c.id === where.id)!;
        category.name = data.name;

        return category;
      },
    },
    recipe: {
      create: async () => {
        writes++;

        return row();
      },
      update: async ({ data }: { data: { searchText?: string } }) => {
        writes++;

        if (data.searchText !== undefined) searchText = data.searchText;

        return row();
      },
      findUniqueOrThrow: async () => row(),
      findMany: async () => [row()],
    },
    recipeCategory: {
      deleteMany: async () => {
        links = [];
      },
      createMany: async ({ data }: { data: { categoryId: number }[] }) => {
        links = data.map((link) => link.categoryId);
      },
    },
    ingredient: empty,
    preparationStep: empty,
    recipeTag: empty,
    favorite: empty,
    review: empty,
    preparation: empty,
    planningEntry: empty,
    shoppingList: empty,
    tag: empty,
  } as unknown as Transaction;

  return {
    tx,
    row,
    links: () => links,
    searchText: () => searchText,
    writes: () => writes,
  };
}

function useDatabase(t: TestContext, tx: unknown) {
  const globalDb = globalThis as unknown as {
    kitchenDb?: ReturnType<typeof getDb>;
  };

  const previous = globalDb.kitchenDb;
  globalDb.kitchenDb = {
    $transaction: async (run: (value: unknown) => unknown) => run(tx),
  } as unknown as ReturnType<typeof getDb>;
  t.after(() => {
    globalDb.kitchenDb = previous;
  });
}

test("edição substitui categorias e reindexa todas sem duplicar a receita", async () => {
  const f = fixture();
  const command = commandSchema.parse({
    type: "recipe.save",
    id: 7,
    values: recipeValues,
  });

  assert.equal(command.type, "recipe.save");

  if (command.type !== "recipe.save") return;

  assert.equal(await saveRecipe(f.tx, command), 7);
  assert.deepEqual(f.links().sort(), [1, 2]);
  assert.deepEqual(recipeDto(f.row()).categories, ["Saudáveis", "Sobremesas"]);
  assert.match(f.searchText(), /saudaveis/);
  assert.match(f.searchText(), /sobremesas/);

  await saveRecipe(f.tx, {
    ...command,
    values: { ...command.values, categories: ["Sobremesas"] },
  });
  assert.deepEqual(f.links(), [2]);
  assert.doesNotMatch(f.searchText(), /saudaveis/);
});

test("categoria inexistente é recusada antes de alterar a receita ou seus vínculos", async () => {
  const f = fixture();
  const command = commandSchema.parse({
    type: "recipe.save",
    id: 7,
    values: { ...recipeValues, categories: ["Inexistente"] },
  });

  if (command.type !== "recipe.save") throw new Error("Comando inválido");

  await assert.rejects(saveRecipe(f.tx, command), /categorias existentes/);
  assert.equal(f.writes(), 0);
  assert.deepEqual(f.links(), [1]);
});

test("biblioteca consulta qualquer categoria associada sem expandir linhas da receita", async (t) => {
  const f = fixture();
  const tx = {
    recipe: {
      count: async ({ where }: { where: Prisma.RecipeWhereInput }) => {
        assert.deepEqual(where.categories, {
          some: { category: { name: "Sobremesas" } },
        });

        return 1;
      },
      findMany: async () => [f.row()],
    },
  };

  useDatabase(t, tx);

  const page = await findRecipePage(
    recipeListInput.parse({ category: "Sobremesas" }),
  );

  assert.equal(page.total, 1);
  assert.equal(page.items.length, 1);
});

test("contadores incluem a receita nas duas categorias mantendo o total único", async () => {
  const f = fixture();
  const command = commandSchema.parse({
    type: "recipe.save",
    id: 7,
    values: recipeValues,
  });

  if (command.type !== "recipe.save") throw new Error("Comando inválido");

  await saveRecipe(f.tx, command);

  const state = await snapshot(f.tx);
  assert.equal(state.recipeCount, 1);
  assert.deepEqual(state.categoryCounts, { Saudáveis: 1, Sobremesas: 1 });
});

test("renomear categoria reindexa as receitas pela nova relação", async () => {
  const f = fixture();
  await saveCategory(f.tx, "Leves", 1);
  assert.match(f.searchText(), /leves/);
  assert.doesNotMatch(f.searchText(), /saudaveis/);
});

test("pesquisa combina categorias com EXISTS parametrizado e permite remover os filtros", async (t) => {
  const queries: Prisma.Sql[] = [];
  useDatabase(t, {
    $queryRaw: async (query: Prisma.Sql) => {
      queries.push(query);

      return [];
    },
    recipe: { findMany: async () => [] },
  });

  const result = await searchRecipes({ q: "sobremesa saudável" });
  assert.deepEqual(result.parsed.categories, ["Sobremesas", "Saudáveis"]);
  assert.equal((queries[0].sql.match(/EXISTS/g) ?? []).length, 2);
  assert.deepEqual(queries[0].values, ["Sobremesas", "Saudáveis"]);
  assert.doesNotMatch(queries[0].sql, /SELECT r.id FROM .*Recipe" r JOIN/);

  queries.length = 0;
  await searchRecipes({ q: "sobremesa saudável", categories: [] });
  assert.doesNotMatch(queries[0].sql, /RecipeCategory/);
});
