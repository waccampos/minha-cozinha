import "dotenv/config";

import { spawnSync } from "node:child_process";

import { databaseUrl } from "../src/server/database/config";

// Nunca executar deploy sem uma conexão explicitamente configurada.
try {
  databaseUrl(process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL);
} catch {
  console.error(
    "Configure DATABASE_URL (ou MIGRATION_DATABASE_URL) antes de aplicar migrations.",
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
