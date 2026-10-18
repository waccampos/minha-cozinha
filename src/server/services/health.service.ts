import "server-only";

import { checkApplicationDatabase } from "@/server/database/prisma";
import { logFailure } from "@/server/logger";
import { checkImageStorage } from "@/server/storage/image-storage";

let cached: { expires: number; ok: boolean } | undefined;

export async function healthy() {
  if (cached && cached.expires > Date.now()) return cached.ok;

  const started = Date.now();
  let ok = false;
  let operation = "health.database";

  try {
    await checkApplicationDatabase();
    operation = "health.storage";
    await checkImageStorage();
    ok = true;
  } catch (error) {
    logFailure("health.not_ready", error, {
      durationMs: Date.now() - started,
      operation,
      status: 503,
    });
  }

  cached = { expires: Date.now() + 10000, ok };

  return ok;
}
