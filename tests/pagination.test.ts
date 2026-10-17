import assert from "node:assert/strict";
import test from "node:test";

import { recipeListInput } from "../src/schemas/recipe-list.schema";

test("paginação limita volume e valida filtros antes de consultar", () => {
  assert.equal(recipeListInput.parse({}).limit, 12);
  assert.equal(recipeListInput.safeParse({ limit: 1000 }).success, false);
  assert.equal(recipeListInput.safeParse({ page: -1 }).success, false);
  assert.equal(
    recipeListInput.safeParse({ q: "x".repeat(401) }).success,
    false,
  );
});
