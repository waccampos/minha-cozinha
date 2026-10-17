import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getDb, type Transaction } from "@/server/database/prisma";

export function findImage(id: string, tx: Transaction = getDb()) {
  return tx.image.findUnique({ where: { id } });
}

export function createImage(tx: Transaction, data: Prisma.ImageCreateInput) {
  return tx.image.create({ data });
}

export function unusedImages(tx: Transaction, cutoff: Date) {
  return tx.image.findMany({
    where: {
      createdAt: { lt: cutoff },
      recipes: { none: {} },
      reviews: { none: {} },
    },
  });
}

export function deleteImage(tx: Transaction, id: string) {
  return tx.image.delete({ where: { id } });
}

export async function imageFileNames(tx: Transaction) {
  const rows = await tx.image.findMany({ select: { fileName: true } });

  return new Set(rows.map((row) => row.fileName));
}
