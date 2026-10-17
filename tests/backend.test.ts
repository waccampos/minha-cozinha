import assert from "node:assert/strict";
import test from "node:test";

import { parseSearch } from "../src/lib/search-parser";
import { commandSchema } from "../src/schemas/kitchen-command.schema";
import { databaseUrl } from "../src/server/database/config";
import {
  inspectImage,
  imageFileName,
} from "../src/server/storage/image-validation";

test("a conexão sempre é isolada sem alterar a credencial", () => {
  const url = new URL(
    databaseUrl(
      "postgresql://app:secret@localhost:5432/existing?sslmode=require",
    ),
  );

  assert.equal(url.searchParams.get("schema"), "minha_cozinha");
  assert.equal(url.pathname, "/existing");
  assert.equal(url.password, "secret");
  assert.throws(() => databaseUrl("http://localhost"));
  assert.throws(() => databaseUrl(""));
});

test("interpreta ingredientes, sinônimos, exclusões, tempo e temperatura", () => {
  const parsed = parseSearch(
    "Quero macarrão quente com tomate sem leite em até 30 minutos",
  );

  assert.deepEqual(parsed.categories, ["Massas"]);
  assert.equal(parsed.temperature, "Quente");
  assert.equal(parsed.maxTime, 30);
  assert.ok(parsed.include.includes("tomate"));
  assert.ok(parsed.exclude.includes("leite"));
  assert.ok(!parsed.include.includes("leite"));
  assert.equal(parseSearch("algo rápido e gelado com morangos").maxTime, 20);
  assert.ok(parseSearch("sem açúcar").exclude.includes("acucar"));
});

test("valida identificadores, datas, listas e avaliações no servidor", () => {
  assert.equal(
    commandSchema.safeParse({ type: "recipe.delete", id: -1 }).success,
    false,
  );
  assert.equal(
    commandSchema.safeParse({
      type: "review.save",
      recipeId: 1,
      values: { rating: 6 },
    }).success,
    false,
  );
  assert.equal(
    commandSchema.safeParse({
      type: "meal.set",
      date: "2026-02-30",
      meal: 0,
      recipeId: 1,
    }).success,
    false,
  );
  assert.equal(
    commandSchema.safeParse({ type: "shopping.add", listId: "x", label: "  " })
      .success,
    false,
  );
  assert.equal(
    commandSchema.safeParse({ type: "favorite.set", recipeId: 1, value: true })
      .success,
    true,
  );
});

test("recusa imagens falsas, grandes e nomes com travessia", () => {
  assert.throws(() =>
    inspectImage(Buffer.from("<svg><script/></svg>"), "image/png"),
  );
  assert.throws(() =>
    inspectImage(Buffer.alloc(5 * 1024 * 1024 + 1), "image/jpeg"),
  );
  assert.throws(() => imageFileName("../../etc/passwd"));
  assert.equal(
    imageFileName("9eaf2535-2549-4d57-9f19-87d5d7710a44.jpg"),
    "9eaf2535-2549-4d57-9f19-87d5d7710a44.jpg",
  );
});

test("exclusões múltiplas não incluem ingredientes proibidos e tempo não vira ingrediente", () => {
  const result = parseSearch(
    "sem leite e ovos, com tomate em menos de 20 minutos",
  );

  assert.ok(result.exclude.includes("leite"));
  assert.ok(result.exclude.includes("ovo"));
  assert.ok(!result.include.includes("leite"));
  assert.ok(!result.include.includes("ovo"));
  assert.equal(result.maxTime, 20);
});

test("remoção de estruturas não sobra na busca textual livre", () => {
  const result = parseSearch(
    "sem leite, ovos com tomate em menos de 20 minutos",
  );

  assert.ok(result.exclude.includes("ovo"));
  assert.equal(result.terms, "");
});
