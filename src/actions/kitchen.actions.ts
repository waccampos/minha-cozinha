"use server";

import { randomUUID } from "node:crypto";

import { publicError } from "@/lib/errors";
import { logContext } from "@/server/log-context";
import { log, logFailure, commandOperation } from "@/server/logger";
import { executeCommand } from "@/server/services/kitchen.service";

// Uma única fronteira pública: toda entrada é validada novamente no servidor.
export async function mutateKitchen(input: unknown) {
  return logContext.run(
    { requestId: randomUUID(), operation: commandOperation(input) },
    async () => {
      const started = performance.now();

      try {
        const result = await executeCommand(input);
        log("info", "kitchen.mutation", {
          status: 200,
          durationMs: Math.round(performance.now() - started),
        });

        return { ok: true as const, ...result };
      } catch (error) {
        logFailure("kitchen.mutation_failed", error, {
          durationMs: Math.round(performance.now() - started),
        });

        return { ok: false as const, error: publicError(error).message };
      }
    },
  );
}
