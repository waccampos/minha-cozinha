import { ZodError } from "zod";

export class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function publicError(error: unknown): {
  message: string;
  status: number;
} {
  if (error instanceof DomainError)
    return { message: error.message, status: error.status };

  if (error instanceof ZodError)
    return {
      message: error.issues
        .map((i) => i.message)
        .slice(0, 3)
        .join(" "),
      status: 400,
    };

  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  if (code === "P2025")
    return {
      message: "Registro não encontrado. Atualize a página.",
      status: 404,
    };

  if (code === "P2002")
    return { message: "Este registro já existe.", status: 409 };

  if (code === "P2003")
    return {
      message: "Este registro está em uso ou foi removido. Atualize a página.",
      status: 409,
    };

  return {
    message:
      "Não foi possível acessar os dados da cozinha. Verifique a configuração e a conexão do servidor.",
    status: 503,
  };
}

export function diagnosticCode(error: unknown) {
  const raw =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  return /^(P[0-9]{4}|EACCES|EPERM|ENOSPC|ENOENT|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN)$/.test(
    raw,
  )
    ? raw
    : "UNEXPECTED";
}
