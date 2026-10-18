import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { dependencyIssues } from "../scripts/dependency-policy";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));

test("lockfile contém versões completas inclusive em dependências opcionais de outras plataformas", () => {
  for (const [name, entry] of Object.entries(lock.packages)) {
    const dependency = entry as { link?: boolean; version?: string };

    if (!name || dependency.link) continue;

    assert.equal(
      typeof dependency.version,
      "string",
      `Versão ausente em ${name}`,
    );
    assert.match(
      dependency.version!,
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,
      `Versão inválida em ${name}`,
    );
  }
});

test("dependências reais do deploy atendem ao piso de segurança do projeto", () => {
  assert.deepEqual(dependencyIssues(lock.packages), []);
});

test("npm ci aceita o lockfile em diretório limpo sem rede ou scripts", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "cozinha-lock-check-"));

  try {
    for (const name of ["package.json", "package-lock.json"])
      copyFileSync(name, path.join(directory, name));

    assert.ok(process.env.npm_execpath, "Execute os testes com npm test.");

    const result = spawnSync(
      process.execPath,
      [
        process.env.npm_execpath,
        "ci",
        "--dry-run",
        "--ignore-scripts",
        "--offline",
        "--no-audit",
        "--no-fund",
        "--cache",
        path.join(directory, "cache"),
      ],
      {
        cwd: directory,
        encoding: "utf8",
        timeout: 20000,
      },
    );

    assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
