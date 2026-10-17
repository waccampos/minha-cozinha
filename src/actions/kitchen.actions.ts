"use server";

import { publicError, diagnosticCode } from "@/lib/errors";
import { log } from "@/server/logger";
import { executeCommand } from "@/server/services/kitchen.service";

// Uma única fronteira pública: toda entrada é validada novamente no servidor.
export async function mutateKitchen(input: unknown) {
  try {
    const started = Date.now();
    const result = await executeCommand(input);
    log("info", "kitchen.mutation", { durationMs: Date.now() - started });

    return { ok: true as const, ...result };
  } catch (error) {
    log("error", "kitchen.mutation_failed", {
      status: publicError(error).status,
      code: diagnosticCode(error),
    });

    return { ok: false as const, error: publicError(error).message };
  }
}
