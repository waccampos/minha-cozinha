import assert from "node:assert/strict";
import test from "node:test";

import { mutateKitchen } from "../src/actions/kitchen.actions";
import { POST as mutate } from "../src/app/api/kitchen/route";
import { POST as upload } from "../src/app/api/images/route";
import { GET as readImage } from "../src/app/api/images/[id]/route";

const origin = "http://localhost:3000";

test("operações sem cookies continuam validando os dados no servidor", async (context) => {
  context.mock.method(console, "warn", () => {});
  context.mock.method(console, "error", () => {});

  const response = await mutate(
    new Request(`${origin}/api/kitchen`, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "recipe.delete", id: -1 }),
    }),
  );

  assert.equal(response.status, 400);

  const result = await mutateKitchen({ type: "recipe.delete", id: -1 });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.doesNotMatch(result.error, /sessão|entre novamente/i);
  }
});

test("remoção do login mantém a proteção de origem nas alterações", async (context) => {
  context.mock.method(console, "warn", () => {});

  const response = await mutate(
    new Request(`${origin}/api/kitchen`, {
      method: "POST",
      headers: {
        Origin: "http://outro-site.test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "recipe.delete", id: 1 }),
    }),
  );

  assert.equal(response.status, 403);
});

test("imagens sem sessão continuam recusando arquivos e identificadores inválidos", async (context) => {
  context.mock.method(console, "warn", () => {});

  const invalidFile = await upload(
    new Request(`${origin}/api/images`, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "image/png" },
      body: "isto não é uma imagem",
    }),
  );

  assert.equal(invalidFile.status, 400);

  const invalidId = await readImage(
    new Request(`${origin}/api/images/invalido`),
    {
      params: Promise.resolve({ id: "invalido" }),
    },
  );

  assert.equal(invalidId.status, 400);
});
