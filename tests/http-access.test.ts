import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";

import { mutateKitchen } from "../src/actions/kitchen.actions";
import { POST as mutate } from "../src/app/api/kitchen/route";
import { POST as upload } from "../src/app/api/images/route";
import { GET as readImage } from "../src/app/api/images/[id]/route";
import { assertSameOrigin } from "../src/server/http";

const origin = "http://localhost:3000";

function configureOrigins(context: TestContext, value: string) {
  const previous = process.env.APP_ORIGINS;
  process.env.APP_ORIGINS = value;
  context.after(() => {
    if (previous === undefined) delete process.env.APP_ORIGINS;
    else process.env.APP_ORIGINS = previous;
  });
}

test("upload pelo IP local preservado em Host chega à validação da imagem", async (context) => {
  context.mock.method(console, "warn", () => {});
  configureOrigins(context, "");

  const response = await upload(
    new Request(`${origin}/api/images`, {
      method: "POST",
      headers: {
        Origin: "http://192.168.1.20:8080",
        Host: "192.168.1.20:8080",
        "Content-Type": "image/png",
      },
      body: "isto não é uma imagem",
    }),
  );

  assert.equal(response.status, 400);
});

test("requisição same-origin do navegador aceita URL interna do proxy diferente", (context) => {
  configureOrigins(context, "");
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request(`${origin}/api/images`, {
        headers: {
          Origin: "https://cozinha.home.arpa",
          "Sec-Fetch-Site": "same-origin",
        },
      }),
    ),
  );
});

test("origem continua exigida e origem externa não é liberada por Host ou forwarded", (context) => {
  configureOrigins(context, "");

  const blockedHeaders: Record<string, string>[] = [
    { "Sec-Fetch-Site": "same-origin" },
    { Origin: "null", "Sec-Fetch-Site": "same-origin" },
    { Origin: "http://outro-site.test", Host: "192.168.1.20:8080" },
    { Origin: "http://outro-site.test", "Sec-Fetch-Site": "same-site" },
    { Origin: "http://outro-site.test", "X-Forwarded-Host": "outro-site.test" },
    { Origin: "https://192.168.1.20:8080", Host: "192.168.1.20:8080" },
    { Origin: origin, "Sec-Fetch-Site": "cross-site" },
  ];

  for (const headers of blockedHeaders) {
    assert.throws(
      () => assertSameOrigin(new Request(`${origin}/api/images`, { headers })),
      /Origem da solicitação não permitida/,
    );
  }
});

test("origens adicionais explícitas continuam aceitas", (context) => {
  configureOrigins(
    context,
    " https://cozinha.home.arpa, http://192.168.1.20:8080 ",
  );
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request(`${origin}/api/images`, {
        headers: { Origin: "https://cozinha.home.arpa" },
      }),
    ),
  );
});

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
