import { DomainError } from "@/lib/errors";
import { assertSameOrigin, withRequestLog } from "@/server/http";
import { setLogOperation } from "@/server/log-context";
import { commandOperation } from "@/server/logger";
import { readKitchen } from "@/server/repositories/kitchen.repository";
import { executeCommand } from "@/server/services/kitchen.service";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const GET = withRequestLog("/api/kitchen", async () => {
  return Response.json(await readKitchen(), {
    headers: { "Cache-Control": "no-store" },
  });
});

export const POST = withRequestLog("/api/kitchen", async (request) => {
  assertSameOrigin(request);

  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new DomainError("Envie JSON.", 415);

  // Limite também durante a leitura para requisições chunked.
  const reader = request.body?.getReader();

  if (!reader) throw new DomainError("Corpo vazio.");

  const chunks: Uint8Array[] = [];
  let length = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    length += value.length;

    if (length > 512 * 1024) {
      await reader.cancel();
      throw new DomainError("Solicitação muito grande.", 413);
    }

    chunks.push(value);
  }

  let input;

  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new DomainError("JSON inválido.");
  }

  setLogOperation(commandOperation(input));

  return Response.json(await executeCommand(input), {
    headers: { "Cache-Control": "no-store" },
  });
});
