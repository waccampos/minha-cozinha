import "server-only";

import { DomainError, publicError, diagnosticCode } from "@/lib/errors";

import { log } from "./logger";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(request.url).origin;
  const allowed = (process.env.APP_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!origin || (origin !== expected && !allowed.includes(origin)))
    throw new DomainError("Origem da solicitação não permitida.", 403);

  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new DomainError("Origem da solicitação não permitida.", 403);
}

export function errorResponse(error: unknown) {
  const value = publicError(error);
  log(value.status >= 500 ? "error" : "warn", "http.request_failed", {
    status: value.status,
    code: diagnosticCode(error),
  });

  return Response.json(
    { error: value.message },
    { status: value.status, headers: { "Cache-Control": "no-store" } },
  );
}
