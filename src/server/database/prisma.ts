import "server-only";

import { existsSync } from "node:fs";

import { BACKUP_LOCK } from "@/constants/database";
import { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { databaseUrl } from "@/server/database/config";
import { SerializedPrismaPg } from "@/server/database/serialized-pg";
import { imageDirectory } from "@/server/storage/config";

const globalDb = globalThis as unknown as { kitchenDb?: PrismaClient };

export function getDb() {
  if (existsSync(imageDirectory() + ".maintenance"))
    throw new DomainError(
      "A cozinha está em manutenção. Tente novamente após a restauração.",
      503,
    );

  if (!globalDb.kitchenDb) {
    const url = new URL(databaseUrl());
    url.searchParams.delete("schema");

    const adapter = new SerializedPrismaPg(
      {
        connectionString: url.toString(),
        max: 8,
        application_name: "minha-cozinha",
        idleTimeoutMillis: 30000,
        statement_timeout: 15000,
        connectionTimeoutMillis: 5000,
      },
      { schema: "minha_cozinha" },
    );

    globalDb.kitchenDb = new PrismaClient({ adapter, log: [] });
  }

  return globalDb.kitchenDb;
}

export type Transaction = Prisma.TransactionClient;

export async function writeTransaction<T>(
  operation: (tx: Transaction) => Promise<T>,
) {
  return getDb().$transaction(
    async (tx) => {
      // Exclusive entre alterações para serializar seleção da lista atual e toggles; backup usa a mesma chave.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BACKUP_LOCK}::bigint)`;

      return operation(tx);
    },
    { maxWait: 10000, timeout: 20000 },
  );
}

export async function checkApplicationDatabase() {
  await getDb().$queryRaw`SELECT id FROM minha_cozinha."Category" LIMIT 1`;
}
