import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve("src");

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const location = path.join(directory, entry.name);

    if (entry.name === "generated") return [];

    return entry.isDirectory() ? files(location) : [location];
  });
}

test("estrutura usa camadas técnicas e elimina agrupamentos por feature", () => {
  for (const name of ["features", "modules", "domains", "data"]) {
    assert.equal(existsSync(path.join(root, name)), false);
  }

  const folders = readdirSync(path.join(root, "components"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(folders, ["common", "forms", "layout", "pages", "ui"]);
});

test("componentes, hooks e schemas não acessam Prisma nem infraestrutura do servidor", () => {
  const locations = ["components", "hooks", "schemas", "types", "constants"];

  for (const directory of locations) {
    for (const file of files(path.join(root, directory))) {
      const source = readFileSync(file, "utf8");

      assert.doesNotMatch(
        source,
        /from\s+["'](?:@\/server\/|@\/generated\/|@prisma\/|pg["'])/,
        file,
      );
      assert.doesNotMatch(
        source,
        /@\/features\/|@\/modules\/|@\/domains\//,
        file,
      );
    }
  }
});

test("services coordenam regras e delegam consultas aos repositórios", () => {
  for (const file of files(path.join(root, "server/services"))) {
    const source = readFileSync(file, "utf8");

    assert.doesNotMatch(
      source,
      /\b(?:tx|db)\.(?:recipe|review|preparation|ingredient|category|tag|planningEntry|shoppingList|shoppingItem|favorite|image)\./,
      file,
    );
  }
});

test("app contém somente arquivos próprios do App Router", () => {
  const allowed =
    /^(?:page|layout|loading|error|not-found|global-error|route|template|default)\.[jt]sx?$/;

  for (const file of files(path.join(root, "app"))) {
    assert.match(path.basename(file), allowed, file);
  }
});
