import "server-only";

import { publicError } from "@/lib/errors";
import { commandSchema } from "@/schemas/kitchen-command.schema";

import { logContext } from "./log-context";
import { errorDiagnostic } from "./log-diagnostics";

type Level = "info" | "warn" | "error";

const messages = {
  "http.request_completed": "Requisição concluída",
  "http.request_failed": "Falha na requisição",
  "kitchen.mutation": "Alteração da cozinha concluída",
  "kitchen.mutation_failed": "Falha ao alterar a cozinha",
  "health.not_ready": "Verificação de saúde falhou",
  "next.request_failed": "Falha ao processar a página ou ação no Next.js",
} as const;

type Event = keyof typeof messages;

type Fields = {
  code?: string;
  status?: number;
  durationMs?: number;
  operation?: string;
  cause?: string;
  hint?: string;
  validation?: { field: string; type: string }[];
};

const levels = { info: 0, warn: 1, error: 2 };
const commands = new Set<string>(
  commandSchema.options.map((option) => option.shape.type.value),
);

export function commandOperation(input: unknown) {
  if (
    input &&
    typeof input === "object" &&
    "type" in input &&
    typeof input.type === "string" &&
    commands.has(input.type)
  )
    return input.type;

  return "kitchen.command";
}

export function log(level: Level, event: Event, fields: Fields = {}) {
  const configured = process.env.LOG_LEVEL;
  const minimum =
    configured === "warn" || configured === "error" ? configured : "info";

  if (levels[level] < levels[minimum]) return;

  const context = logContext.getStore();
  // Lista explícita em runtime: não espalhar objetos recebidos nem serializar Error/request.
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message: messages[event],
    requestId: context?.requestId,
    operation: fields.operation ?? context?.operation,
    route: context?.route,
    method: context?.method,
    status: fields.status,
    durationMs: fields.durationMs,
    code: fields.code,
    cause: fields.cause,
    hint: fields.hint,
    validation: fields.validation,
  };

  const details = [
    entry.operation && `Operação: ${entry.operation}`,
    entry.route && `Rota: ${entry.method} ${entry.route}`,
    entry.status !== undefined && `Status: ${entry.status}`,
    entry.durationMs !== undefined && `Duração: ${entry.durationMs} ms`,
    entry.requestId && `Requisição: ${entry.requestId}`,
    entry.code && `Código: ${entry.code}`,
    entry.cause && `Causa: ${entry.cause}`,
    entry.validation?.length &&
      `Campos: ${entry.validation.map((issue) => `${issue.field} (${issue.type})`).join(", ")}`,
    entry.hint && `Orientação: ${entry.hint}`,
  ].filter(Boolean);

  const line =
    process.env.LOG_FORMAT === "json"
      ? JSON.stringify(entry)
      : `${entry.timestamp} ${level.toUpperCase()} — ${entry.message}\n${details.map((detail) => `  ${detail}`).join("\n")}`;

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logFailure(event: Event, error: unknown, fields: Fields = {}) {
  const status = fields.status ?? publicError(error).status;
  log(status >= 500 ? "error" : "warn", event, {
    ...fields,
    ...errorDiagnostic(error),
    status,
  });
}
