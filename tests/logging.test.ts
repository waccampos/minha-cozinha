import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";

import { ZodError, z } from "zod";

import { mutateKitchen } from "../src/actions/kitchen.actions";
import { POST as mutate } from "../src/app/api/kitchen/route";
import { GET as health } from "../src/app/api/health/route";
import { DomainError } from "../src/lib/errors";
import { getDb } from "../src/server/database/prisma";
import { withRequestLog } from "../src/server/http";
import { log, logFailure, commandOperation } from "../src/server/logger";

function capture(context: TestContext, format = "json", level = "info") {
  const previous = {
    format: process.env.LOG_FORMAT,
    level: process.env.LOG_LEVEL,
  };

  process.env.LOG_FORMAT = format;
  process.env.LOG_LEVEL = level;
  context.after(() => {
    if (previous.format === undefined) delete process.env.LOG_FORMAT;
    else process.env.LOG_FORMAT = previous.format;

    if (previous.level === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = previous.level;
  });

  const lines: { level: string; text: string }[] = [];

  for (const level of ["info", "warn", "error"] as const) {
    context.mock.method(console, level, (line: string) =>
      lines.push({ level, text: line }),
    );
  }

  return lines;
}

test("logs legíveis descrevem operação, causa, orientação e duração", (context) => {
  const lines = capture(context, "pretty");
  logFailure(
    "kitchen.mutation_failed",
    Object.assign(new Error("senha-secreta"), { code: "ECONNREFUSED" }),
    { operation: "recipe.save", durationMs: 42 },
  );
  assert.equal(lines[0].level, "error");
  assert.match(lines[0].text, /Falha ao alterar a cozinha/);
  assert.match(lines[0].text, /recipe.save/);
  assert.match(lines[0].text, /conexão.*recusada/i);
  assert.match(lines[0].text, /42 ms/);
  assert.match(lines[0].text, /Orientação:/);
  assert.doesNotMatch(lines[0].text, /senha-secreta/);
});

test("JSON contém campos explícitos e descarta extras em runtime", (context) => {
  const lines = capture(context);
  log("info", "kitchen.mutation", {
    operation: "recipe.save",
    durationMs: 12,
    password: "segredo",
  } as Parameters<typeof log>[2]);

  const entry = JSON.parse(lines[0].text);
  assert.equal(entry.event, "kitchen.mutation");
  assert.equal(entry.operation, "recipe.save");
  assert.equal(entry.durationMs, 12);
  assert.equal(entry.message, "Alteração da cozinha concluída");
  assert.ok(!Number.isNaN(Date.parse(entry.timestamp)));
  assert.doesNotMatch(lines[0].text, /segredo|password/);
});

test("níveis filtram info e warn sem esconder erros", (context) => {
  const lines = capture(context, "json", "error");
  log("info", "kitchen.mutation");
  logFailure("http.request_failed", new DomainError("Entrada inválida"));
  logFailure("http.request_failed", new Error("privado"));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].level, "error");
  assert.equal(JSON.parse(lines[0].text).code, "UNEXPECTED");
});

test("validação registra somente caminhos conhecidos, limitada a dez itens", (context) => {
  const lines = capture(context);
  const error = new ZodError([
    ...Array.from({ length: 12 }, (_, i) => ({
      code: "custom" as const,
      path: ["values", "ingredients", i, "name"],
      message: "conteudo-privado",
    })),
    { code: "custom", path: ["senha-secreta"], message: "privado" },
  ]);

  logFailure("http.request_failed", error);

  const entry = JSON.parse(lines[0].text);
  assert.equal(lines[0].level, "warn");
  assert.equal(entry.code, "VALIDATION_ERROR");
  assert.equal(entry.status, 400);
  assert.equal(entry.validation.length, 10);
  assert.equal(entry.validation[0].field, "values.ingredients.0.name");
  assert.doesNotMatch(lines[0].text, /conteudo-privado|senha-secreta/);
});

test("diagnóstico reconhece erro encapsulado sem expor mensagens ou metadados", (context) => {
  const lines = capture(context);
  logFailure(
    "http.request_failed",
    new Error("postgres://usuario:senha@host/db", {
      cause: Object.assign(new Error("SQL secreto"), { code: "ETIMEDOUT" }),
    }),
  );
  assert.equal(JSON.parse(lines[0].text).code, "ETIMEDOUT");
  assert.doesNotMatch(lines[0].text, /usuario|senha|host|SQL secreto/);
});

test("operações são reconhecidas sem copiar valores arbitrários", () => {
  assert.equal(
    commandOperation({ type: "recipe.save", values: {} }),
    "recipe.save",
  );
  assert.equal(commandOperation({ type: "senha-secreta" }), "kitchen.command");
  assert.equal(commandOperation(null), "kitchen.command");
});

test("HTTP registra sucesso e correlaciona resposta sem copiar URL ou headers", async (context) => {
  const lines = capture(context);
  const handler = withRequestLog("/api/recipes", async () =>
    Response.json({ ok: true }, { status: 201 }),
  );

  const response = await handler(
    new Request("http://localhost/api/recipes?q=segredo", {
      headers: { "X-Request-Id": "nao-confiavel" },
    }),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });

  const entry = JSON.parse(lines[0].text);
  assert.equal(entry.requestId, response.headers.get("X-Request-Id"));
  assert.match(entry.requestId, /^[a-f0-9-]{36}$/);
  assert.equal(entry.route, "/api/recipes");
  assert.equal(entry.method, "GET");
  assert.equal(entry.status, 201);
  assert.ok(entry.durationMs >= 0);
  assert.doesNotMatch(lines[0].text, /segredo|nao-confiavel/);
});

test("HTTP mantém respostas de erro e classifica falhas 4xx e 5xx", async (context) => {
  const lines = capture(context);

  for (const [error, status, level] of [
    [new DomainError("Recusado.", 403), 403, "warn"],
    [new Error("privado"), 503, "error"],
  ] as const) {
    const response = await withRequestLog("/api/recipes", async () => {
      throw error;
    })(new Request("http://localhost/api/recipes"));

    assert.equal(response.status, status);
    assert.ok(response.headers.get("X-Request-Id"));
    assert.equal(lines.at(-1)?.level, level);
    assert.equal(
      JSON.parse(lines.at(-1)!.text).requestId,
      response.headers.get("X-Request-Id"),
    );
    assert.equal(typeof (await response.json()).error, "string");
  }

  assert.equal(lines.length, 2);
  assert.doesNotMatch(JSON.stringify(lines), /privado/);
});

test("rota de cozinha e Server Action identificam comando e campo inválido", async (context) => {
  const lines = capture(context);
  const input = { type: "recipe.delete", id: -1 };
  const response = await mutate(
    new Request("http://localhost/api/kitchen", {
      method: "POST",
      headers: {
        Origin: "http://localhost",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  );

  assert.equal(response.status, 400);

  const http = JSON.parse(lines[0].text);
  assert.equal(http.operation, "recipe.delete");
  assert.equal(http.route, "/api/kitchen");
  assert.equal(http.validation[0].field, "id");

  const result = await mutateKitchen(input);
  assert.equal(result.ok, false);

  const action = JSON.parse(lines[1].text);
  assert.equal(action.operation, "recipe.delete");
  assert.equal(action.level, "warn");
  assert.ok(action.durationMs >= 0);
});

test("requisições concorrentes mantêm identificadores e rotas isolados", async (context) => {
  const lines = capture(context);
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });

  const first = withRequestLog("/api/recipes", async () => {
    await waiting;

    return Response.json({});
  });

  const pending = first(new Request("http://localhost/api/recipes"));
  const second = await withRequestLog("/api/kitchen", async () =>
    Response.json({}),
  )(new Request("http://localhost/api/kitchen"));

  release();

  const firstResponse = await pending;
  const entries = lines.map((line) => JSON.parse(line.text));
  assert.equal(entries[0].route, "/api/kitchen");
  assert.equal(entries[0].requestId, second.headers.get("X-Request-Id"));
  assert.equal(entries[1].route, "/api/recipes");
  assert.equal(entries[1].requestId, firstResponse.headers.get("X-Request-Id"));
  assert.notEqual(entries[0].requestId, entries[1].requestId);
});

test("diagnóstico de validação não serializa conteúdo do erro Zod", (context) => {
  const lines = capture(context);
  const parsed = z
    .object({ difficulty: z.enum(["Fácil"]) })
    .safeParse({ difficulty: "senha-secreta" });

  assert.equal(parsed.success, false);

  if (!parsed.success) logFailure("http.request_failed", parsed.error);

  assert.doesNotMatch(lines[0].text, /senha-secreta/);
});

test("configurações inválidas usam texto legível e nível info", (context) => {
  const lines = capture(context, "invalido", "invalido");
  log("info", "http.request_completed", { status: 200 });
  assert.equal(lines.length, 1);
  assert.match(lines[0].text, /INFO — Requisição concluída/);
});

test("paths arbitrários e mensagens sensíveis não aparecem na validação", (context) => {
  const lines = capture(context);
  logFailure("http.request_failed", new ZodError([
    { code: "custom", path: ["segredo-do-payload"], message: "senha-privada" },
    { code: "custom", path: ["values", "title"], message: "senha-privada" },
  ]));

  const entry = JSON.parse(lines[0].text);
  assert.deepEqual(entry.validation, [{ field: "values.title", type: "custom" }]);
  assert.doesNotMatch(lines[0].text, /segredo-do-payload|senha-privada/);
});

test("diagnóstico identifica banco e armazenamento com orientações específicas", (context) => {
  const lines = capture(context);

  for (const [code, expected] of [["P2002", /valor único/], ["EACCES", /permissão/], ["EEXIST", /diretório/], ["EROFS", /somente leitura/]] as const) {
    logFailure("http.request_failed", Object.assign(new Error("privado"), { code }));

    const entry = JSON.parse(lines.at(-1)!.text);
    assert.equal(entry.code, code);
    assert.match(entry.cause, expected);
    assert.ok(entry.hint.length > 0);
  }
});

test("saúde distingue banco e armazenamento e não repete falhas em cache", async (context) => {
  const lines = capture(context);
  const temporary = await mkdtemp(path.join(tmpdir(), "cozinha-log-health-"));
  const previous = process.env.IMAGE_STORAGE_DIR;
  context.after(async () => {
    if (previous === undefined) delete process.env.IMAGE_STORAGE_DIR;
    else process.env.IMAGE_STORAGE_DIR = previous;

    await rm(temporary, { recursive: true, force: true });
  });
  process.env.IMAGE_STORAGE_DIR = temporary;

  let now = Date.now();
  context.mock.method(Date, "now", () => now);

  let databaseFails = true;
  const globalDb = globalThis as unknown as { kitchenDb?: ReturnType<typeof getDb> };
  const previousDb = globalDb.kitchenDb;
  globalDb.kitchenDb = {
    $queryRaw: async () => {
      if (databaseFails) throw Object.assign(new Error("privado"), { code: "ECONNREFUSED" });

      return [];
    },
  } as unknown as ReturnType<typeof getDb>;
  context.after(() => {
    globalDb.kitchenDb = previousDb;
  });

  const request = () => new Request("http://localhost/api/health");
  const first = await health(request());
  assert.equal(first.status, 503);
  assert.equal(lines.length, 1);

  let entry = JSON.parse(lines[0].text);
  assert.equal(entry.operation, "health.database");
  assert.equal(entry.requestId, first.headers.get("X-Request-Id"));
  assert.equal(entry.code, "ECONNREFUSED");
  await health(request());
  assert.equal(lines.length, 1);
  databaseFails = false;
  now += 10001;

  const notDirectory = path.join(temporary, "file");
  await writeFile(notDirectory, "");
  process.env.IMAGE_STORAGE_DIR = notDirectory;

  const second = await health(request());
  assert.equal(second.status, 503);
  assert.equal(lines.length, 2);
  entry = JSON.parse(lines[1].text);
  assert.equal(entry.operation, "health.storage");
  assert.equal(entry.requestId, second.headers.get("X-Request-Id"));
  assert.equal(entry.code, "EEXIST");
  now += 10001;
  process.env.IMAGE_STORAGE_DIR = temporary;

  const recovered = await health(request());
  assert.equal(recovered.status, 200);
  assert.deepEqual(await recovered.json(), { status: "ok" });
  assert.equal(lines.length, 2);
});
