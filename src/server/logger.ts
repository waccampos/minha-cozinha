type Fields = {
  code?: string;
  status?: number;
  durationMs?: number;
  operation?: string;
};

export function log(
  level: "info" | "warn" | "error",
  event: string,
  fields: Fields = {},
) {
  // Lista explícita de campos: nunca serializar Error, request, corpo, senha, URL ou cabeçalhos.
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
