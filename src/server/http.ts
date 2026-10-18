import "server-only";

import { randomUUID } from "node:crypto";

import { DomainError, publicError } from "@/lib/errors";

import { logContext } from "./log-context";
import { log, logFailure } from "./logger";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const fetchSite = request.headers.get("sec-fetch-site");
  const allowed = (process.env.APP_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!origin || origin === "null" || fetchSite === "cross-site")
    throw new DomainError("Origem da solicitação não permitida.", 403);

  // O proxy pode deixar request.url com o endereço interno do Next.
  // Host cobre HTTP local; Fetch Metadata cobre HTTPS com terminação no proxy.
  const sameOrigin =
    origin === url.origin ||
    (host !== null && origin === `${url.protocol}//${host}`) ||
    fetchSite === "same-origin";

  if (!sameOrigin && !allowed.includes(origin))
    throw new DomainError("Origem da solicitação não permitida.", 403);
}

export function errorResponse(error: unknown) {
  const value = publicError(error);

  return Response.json(
    { error: value.message },
    { status: value.status, headers: { "Cache-Control": "no-store" } },
  );
}

type ApiRoute =
  | "/api/kitchen"
  | "/api/recipes"
  | "/api/recipes/[id]"
  | "/api/search"
  | "/api/search/pantry"
  | "/api/images"
  | "/api/images/[id]"
  | "/api/health";

export function withRequestLog<Args extends unknown[]>(
  route: ApiRoute,
  handler: (request: Request, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    const requestId = randomUUID();
    // Não copiar métodos desconhecidos, headers ou o URL real para o contexto.
    const method = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ].includes(request.method)
      ? request.method
      : "OTHER";

    return logContext.run(
      { requestId, route, method, operation: `${method} ${route}` },
      async () => {
        const started = performance.now();
        let response: Response;
        let failure: unknown;
        let failed = false;

        try {
          response = await handler(request, ...args);
        } catch (error) {
          failed = true;
          failure = error;
          response = errorResponse(error);
        }

        const fields = {
          status: response.status,
          durationMs: Math.round(performance.now() - started),
        };

        // A saúde registra a causa no serviço e usa cache; não repetir a falha a cada probe.
        if (route !== "/api/health" || failed) {
          if (response.status >= 400)
            logFailure("http.request_failed", failure, fields);
          else log("info", "http.request_completed", fields);
        }

        response.headers.set("X-Request-Id", requestId);

        return response;
      },
    );
  };
}
