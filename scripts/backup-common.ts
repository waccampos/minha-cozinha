import "dotenv/config";

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "node:path";

import { Client } from "pg";

import { BACKUP_LOCK } from "../src/constants/database";
import { databaseUrl } from "../src/server/database/config";

export const backupRoot = () =>
  path.resolve(process.env.BACKUP_DIR || "./backups");

export async function locked<T>(
  work: (client: Client, environment: NodeJS.ProcessEnv) => Promise<T>,
) {
  const url = new URL(
    databaseUrl(process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL),
  );

  url.searchParams.delete("schema");

  const client = new Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 5000,
  });

  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGCONNECT_TIMEOUT: "10",
  };

  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"] as const)
    if (url.searchParams.has(key))
      environment[`PG${key.toUpperCase()}`] = url.searchParams.get(key)!;
  await client.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1::bigint)", [BACKUP_LOCK]);

    return await work(client, environment);
  } finally {
    await client.end();
  }
}

export async function run(
  binary: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const output: Buffer[] = [];
    child.stdout.on("data", (chunk) => output.push(chunk));
    // Nunca registrar a conexão ou stderr contendo detalhes da infraestrutura.
    child.stderr.resume();
    child.on("error", () =>
      reject(new Error(`Não foi possível executar ${binary}.`)),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(output).toString("utf8"))
        : reject(
            new Error(
              `${binary} falhou. Verifique versão do cliente PostgreSQL, conexão e permissões.`,
            ),
          ),
    );
  });
}

export async function digest(file: string) {
  const hash = createHash("sha256");

  for await (const chunk of createReadStream(file)) hash.update(chunk);

  return hash.digest("hex");
}
