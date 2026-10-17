import assert from "node:assert/strict";
import test from "node:test";

import type { Transaction } from "../src/server/database/prisma";
import { snapshot } from "../src/server/repositories/kitchen.repository";

test("snapshot aguarda cada consulta antes de reutilizar a conexão da transação", async () => {
  let executing = false;
  let completed = 0;

  async function findMany() {
    assert.equal(executing, false, "consultas sobrepostas na mesma conexão");
    executing = true;

    try {
      await new Promise<void>((resolve) => setImmediate(resolve));
      completed += 1;

      return [];
    } finally {
      executing = false;
    }
  }

  const model = { findMany };
  const tx = {
    recipe: model,
    favorite: model,
    review: model,
    preparation: model,
    planningEntry: model,
    shoppingList: model,
    category: model,
    tag: model,
  } as unknown as Transaction;

  const result = await snapshot(tx);

  assert.equal(completed, 10);
  assert.equal(result.recipeCount, 0);
  assert.deepEqual(result.recipes, []);
});
