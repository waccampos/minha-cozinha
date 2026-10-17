import "server-only";

import { diagnosticCode } from "@/lib/errors";
import { checkApplicationDatabase } from "@/server/database/prisma";
import { log } from "@/server/logger";
import { checkImageStorage } from "@/server/storage/image-storage";

let cached: { expires: number; ok: boolean } | undefined;

export async function healthy() {
  if (cached && cached.expires > Date.now()) return cached.ok;

  const started = Date.now();
  let ok = false;

  try {
    await checkApplicationDatabase();
    await checkImageStorage();
    ok = true;
  } catch (error) {
    log("warn", "health.not_ready", {
      durationMs: Date.now() - started,
      code: diagnosticCode(error),
    });
  }

  cached = { expires: Date.now() + 10000, ok };

  return ok;
}
