import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

test(
  "PostgreSQL real: CRUD, histórico, favoritos idempotentes, agenda e listas",
  { skip: !process.env.DATABASE_URL || process.env.RUN_DATABASE_TESTS !== "1" },
  async () => {
    const { executeCommand } = await import(
      "../src/server/services/kitchen.service"
    );

    const { getDb } = await import("../src/server/database/prisma");
    const { readKitchen } = await import(
      "../src/server/repositories/kitchen.repository"
    );

    const { searchRecipes } = await import(
      "../src/server/services/search.service"
    );

    const marker = "Integração " + randomUUID();
    const initial = await readKitchen();
    let categoryId: number | undefined;
    let recipeId: number | undefined;
    let listId: string | undefined;

    try {
      categoryId = Number(
        (await executeCommand({ type: "category.save", name: marker })).id,
      );

      const values = {
        title: marker,
        description: "Tomate com mandioca",
        category: marker,
        time: 15,
        servings: "2 porções",
        difficulty: "Fácil",
        temperature: "Quente",
        flavor: "Salgado",
        notes: "",
        image: "",
        tags: [],
        ingredients: [
          { name: "tomate", quantity: "2", unit: "un." },
          { name: "mandioca", quantity: "200", unit: "g" },
        ],
        steps: [{ text: "Cozinhe a mandioca e adicione o tomate." }],
      };

      recipeId = Number(
        (await executeCommand({ type: "recipe.save", values })).id,
      );
      assert.ok(recipeId > 0);
      await executeCommand({ type: "favorite.set", recipeId, value: true });
      await executeCommand({ type: "favorite.set", recipeId, value: true });
      assert.equal(await getDb().favorite.count({ where: { recipeId } }), 1);

      const review = {
        date: "2026-10-19",
        rating: 5,
        experience: "Ótimo preparo",
        changes: "",
        image: "",
      };

      const first = String(
        (
          await executeCommand({
            type: "review.save",
            recipeId,
            values: review,
          })
        ).id,
      );

      await executeCommand({
        type: "review.save",
        recipeId,
        values: { ...review, rating: 3 },
      });

      let row = await getDb().recipe.findUniqueOrThrow({
        where: { id: recipeId },
      });
      assert.equal(row.reviewCount, 2);
      assert.equal(row.rating, 4);
      await executeCommand({
        type: "review.save",
        id: first,
        recipeId,
        values: { ...review, rating: 1 },
      });
      row = await getDb().recipe.findUniqueOrThrow({ where: { id: recipeId } });
      assert.equal(row.reviewCount, 2);
      assert.equal(row.rating, 2);
      await assert.rejects(
        executeCommand({
          type: "recipe.save",
          id: recipeId,
          values: { ...values, steps: [] },
        }),
      );
      assert.equal(
        await getDb().preparationStep.count({ where: { recipeId } }),
        1,
      );

      const search = await searchRecipes({
        q: "quente com aipim sem leite em até 20 minutos",
        category: marker,
      });

      assert.ok(search.recipes.some((r) => r.id === recipeId));
      assert.ok(
        !(
          await searchRecipes({ q: "sem tomate", category: marker })
        ).recipes.some((r) => r.id === recipeId),
      );
      await executeCommand({
        type: "meal.set",
        date: "2080-01-01",
        meal: 3,
        recipeId,
      });
      listId = String(
        (
          await executeCommand({
            type: "shopping.generate",
            start: "2080-01-01",
            end: "2080-01-01",
          })
        ).id,
      );

      const item = await getDb().shoppingItem.findFirstOrThrow({
        where: { listId },
      });

      await executeCommand({
        type: "shopping.update",
        id: item.id,
        checked: true,
      });
      assert.equal(
        (
          await getDb().shoppingItem.findUniqueOrThrow({
            where: { id: item.id },
          })
        ).checked,
        true,
      );
      await executeCommand({ type: "review.delete", id: first });
      assert.equal(await getDb().preparation.count({ where: { recipeId } }), 2);
      await executeCommand({
        type: "recipe.save",
        id: recipeId,
        values: { ...values, title: marker + " editada" },
      });
      assert.equal(
        (await getDb().recipe.findUniqueOrThrow({ where: { id: recipeId } }))
          .title,
        marker + " editada",
      );
    } finally {
      if (recipeId)
        await getDb().recipe.deleteMany({
          where: { id: recipeId, title: { startsWith: marker } },
        });

      if (listId)
        await getDb().shoppingList.deleteMany({ where: { id: listId } });

      if (initial.currentListId)
        await getDb().shoppingList.update({
          where: { id: initial.currentListId },
          data: { current: true },
        });

      if (categoryId)
        await getDb().category.deleteMany({
          where: { id: categoryId, name: marker },
        });

      await getDb().$disconnect();
    }
  },
);
