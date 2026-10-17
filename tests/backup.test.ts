import assert from "node:assert/strict";
import test from "node:test";

import {
  backupManifest,
  checkCompatibility,
  validateArchiveToc,
} from "../scripts/backup-manifest";

const good = {
  version: 1,
  schema: "minha_cozinha",
  createdAt: "2026-10-17T12:00:00Z",
  postgresMajor: 17,
  migrations: ["202610170001_initial"],
  database: { file: "database.dump", sha256: "a".repeat(64) },
  images: [
    {
      name: "9eaf2535-2549-4d57-9f19-87d5d7710a44.jpg",
      sha256: "b".repeat(64),
    },
  ],
};

test("backup recusa outro schema, caminhos externos, formato e checksum inválidos", () => {
  assert.ok(backupManifest.safeParse(good).success);

  for (const input of [
    { ...good, schema: "public" },
    { ...good, version: 2 },
    { ...good, database: { file: "../database.dump", sha256: "x" } },
    { ...good, images: [{ name: "../../secret.jpg", sha256: "a".repeat(64) }] },
  ])
    assert.equal(backupManifest.safeParse(input).success, false);
});

test("restauração recusa downgrade do PostgreSQL, migração desconhecida e imagens duplicadas", () => {
  const value = backupManifest.parse(good);
  assert.doesNotThrow(() =>
    checkCompatibility(value, 17, ["202610170001_initial"]),
  );
  assert.throws(() => checkCompatibility(value, 16, ["202610170001_initial"]));
  assert.throws(() => checkCompatibility(value, 18, []));
  assert.throws(() =>
    checkCompatibility(
      { ...value, images: [value.images[0], value.images[0]] },
      18,
      ["202610170001_initial"],
    ),
  );
});

test("arquivo de restauração só aceita objetos do schema da aplicação", () => {
  const valid = [
    "; Selected TOC Entries:",
    "1; 0 0 ENCODING - ENCODING",
    "2; 0 0 STDSTRINGS - STDSTRINGS",
    "3; 0 0 SEARCHPATH - SEARCHPATH",
    "4; 2615 12345 SCHEMA - minha_cozinha owner",
    "5; 1259 12346 TABLE minha_cozinha Recipe owner",
    "6; 0 12346 TABLE DATA minha_cozinha Recipe owner",
    "7; 2606 12347 FK CONSTRAINT minha_cozinha Recipe foreign_key owner",
  ].join("\n");

  assert.doesNotThrow(() => validateArchiveToc(valid));
  assert.throws(() =>
    validateArchiveToc("5; 1259 12346 TABLE public minha_cozinha owner"),
  );
  assert.throws(() =>
    validateArchiveToc("5; 1259 12346 TABLE outro_projeto Recipe owner"),
  );
});
