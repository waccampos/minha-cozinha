import assert from "node:assert/strict";
import test from "node:test";

import { interpretQuery } from "../src/lib/search-filters";
import { parseSearch } from "../src/lib/search-parser";
import { commandSchema } from "../src/schemas/kitchen-command.schema";

import { recipeValues } from "./fixtures/recipe";

test("cadastro aceita várias categorias e rejeita seleção vazia, repetida ou inválida", () => {
  const parse = (categories: unknown) =>
    commandSchema.safeParse({
      type: "recipe.save",
      values: { ...recipeValues, categories },
    });

  assert.equal(parse(["Sobremesas", "Saudáveis"]).success, true);
  assert.equal(parse([]).success, false);
  assert.equal(parse(["Sobremesas", " Sobremesas "]).success, false);
  assert.equal(parse([" "]).success, false);
  assert.equal(parse(["x".repeat(81)]).success, false);
  assert.equal(
    parse(Array.from({ length: 31 }, (_, i) => `Categoria ${i}`)).success,
    false,
  );
});

test("busca natural interpreta categorias combinadas sem deixar seus nomes no texto livre", () => {
  const parsed = parseSearch(
    "sobremesas saudáveis com banana sem leite em até 20 minutos",
  );

  assert.deepEqual(parsed.categories, ["Sobremesas", "Saudáveis"]);
  assert.equal(parsed.terms, "");
  assert.deepEqual(parsed.include, ["banana"]);
  assert.deepEqual(parsed.exclude, ["leite"]);
  assert.equal(parsed.maxTime, 20);
  assert.deepEqual(
    interpretQuery("sobremesa saudável").filter(
      (filter) => filter.type === "Categoria",
    ),
    [
      { type: "Categoria", value: "Sobremesas" },
      { type: "Categoria", value: "Saudáveis" },
    ],
  );
});
