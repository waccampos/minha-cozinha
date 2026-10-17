import { APPLICATION_SCHEMA } from "../../constants/database";

export function databaseUrl(value = process.env.DATABASE_URL): string {
  if (!value)
    throw new Error("Configure DATABASE_URL no arquivo .env do servidor.");

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL inválida.");
  }

  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !url.hostname ||
    url.pathname === "/"
  )
    throw new Error(
      "DATABASE_URL deve apontar para um banco PostgreSQL existente.",
    );

  url.searchParams.set("schema", APPLICATION_SCHEMA);

  return url.toString();
}
