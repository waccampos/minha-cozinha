import "server-only";

import { ZodError } from "zod";

import { DomainError } from "@/lib/errors";

const diagnostics: Record<string, readonly [string, string]> = {
  VALIDATION_ERROR: [
    "Campos inválidos na solicitação.",
    "Confira os campos indicados e seus tipos no JSON ou formulário.",
  ],
  DOMAIN_ERROR: [
    "Solicitação recusada por uma regra da aplicação.",
    "Confira a mensagem retornada ao cliente e os dados cadastrados.",
  ],
  FORBIDDEN: [
    "Origem da solicitação não permitida.",
    "Confira Origin, APP_ORIGINS e o endereço usado para acessar a aplicação.",
  ],
  PAYLOAD_TOO_LARGE: [
    "Solicitação acima do tamanho permitido.",
    "Reduza o tamanho do corpo ou da imagem enviada.",
  ],
  UNSUPPORTED_MEDIA_TYPE: [
    "Tipo de conteúdo não permitido.",
    "Confira o Content-Type exigido pelo endpoint.",
  ],
  NOT_FOUND: [
    "Registro não encontrado.",
    "Confira se o registro ainda existe antes de repetir a operação.",
  ],
  ECONNREFUSED: [
    "A conexão com o serviço foi recusada.",
    "Confira se o banco ou serviço está ativo e se host e porta estão acessíveis.",
  ],
  ECONNRESET: [
    "A conexão com o serviço foi interrompida.",
    "Confira a rede e a disponibilidade do banco ou serviço.",
  ],
  ETIMEDOUT: [
    "Tempo limite de conexão excedido.",
    "Confira conectividade, firewall e disponibilidade do banco ou serviço.",
  ],
  ENOTFOUND: [
    "Endereço do serviço não encontrado.",
    "Confira o host configurado e a resolução de DNS.",
  ],
  EAI_AGAIN: [
    "Falha temporária ao resolver o endereço do serviço.",
    "Confira o DNS e a conexão de rede.",
  ],
  EACCES: [
    "Sem permissão para acessar o armazenamento.",
    "Confira as permissões do usuário da aplicação nos volumes de imagens.",
  ],
  EPERM: [
    "Operação no armazenamento não permitida.",
    "Confira as permissões e as restrições dos volumes da aplicação.",
  ],
  ENOSPC: [
    "Armazenamento sem espaço disponível.",
    "Confira o espaço livre e as cotas do volume de imagens.",
  ],
  ENOENT: [
    "Arquivo ou diretório não encontrado.",
    "Confira o volume de imagens e a configuração IMAGE_STORAGE_DIR.",
  ],
  EEXIST: [
    "Um arquivo ocupa o caminho esperado para um diretório.",
    "Confira se IMAGE_STORAGE_DIR aponta para um diretório e se o volume foi montado corretamente.",
  ],
  ENOTDIR: [
    "Um componente do caminho não é um diretório.",
    "Confira o caminho de IMAGE_STORAGE_DIR e a montagem do volume de imagens.",
  ],
  EROFS: [
    "O armazenamento está montado como somente leitura.",
    "Confira se o volume de imagens permite gravação pelo usuário da aplicação.",
  ],
  P1000: [
    "Autenticação no banco recusada.",
    "Confira as credenciais de DATABASE_URL no servidor.",
  ],
  P1001: [
    "Banco de dados indisponível.",
    "Confira host, porta, rede e disponibilidade do PostgreSQL.",
  ],
  P1002: [
    "Tempo limite ao conectar ao banco.",
    "Confira conectividade e disponibilidade do PostgreSQL.",
  ],
  P1017: [
    "Conexão com o banco encerrada.",
    "Confira a disponibilidade e os logs do PostgreSQL.",
  ],
  P2002: [
    "Já existe um registro com esse valor único.",
    "Confira duplicidades antes de repetir o cadastro.",
  ],
  P2003: [
    "Referência a um registro inexistente ou em uso.",
    "Atualize os dados e confira os vínculos do registro.",
  ],
  P2021: [
    "Tabela esperada não encontrada no banco.",
    "Confira o banco e as migrations aplicadas ao schema minha_cozinha.",
  ],
  P2022: [
    "Coluna esperada não encontrada no banco.",
    "Confira se todas as migrations da aplicação foram aplicadas.",
  ],
  P2024: [
    "Tempo limite para obter conexão com o banco.",
    "Confira conexões disponíveis e operações demoradas no PostgreSQL.",
  ],
  P2025: [
    "Registro não encontrado no banco.",
    "Atualize os dados e confira o identificador do registro.",
  ],
  P2028: [
    "A transação do banco não pôde ser concluída.",
    "Confira os limites de tempo, bloqueios e disponibilidade do banco.",
  ],
  "28P01": [
    "Autenticação no PostgreSQL recusada.",
    "Confira as credenciais de DATABASE_URL no servidor.",
  ],
  "42501": [
    "Permissão insuficiente no PostgreSQL.",
    "Confira os grants da role de runtime no schema minha_cozinha.",
  ],
  "42P01": [
    "Tabela não encontrada no PostgreSQL.",
    "Confira o banco e as migrations do schema minha_cozinha.",
  ],
  "42703": [
    "Coluna não encontrada no PostgreSQL.",
    "Confira as migrations aplicadas ao banco.",
  ],
  "53300": [
    "Limite de conexões do PostgreSQL atingido.",
    "Confira o uso do pool e as conexões disponíveis no banco.",
  ],
  "57P01": [
    "PostgreSQL encerrado ou reiniciando.",
    "Confira o estado e os logs do banco.",
  ],
  UNEXPECTED: [
    "Falha interna não classificada.",
    "Use o identificador da requisição e a operação para investigar o servidor.",
  ],
};

// Somente nomes do contrato da aplicação; nunca copiar chaves arbitrárias do payload.
const safeFields = new Set([
  "type",
  "id",
  "values",
  "title",
  "description",
  "categories",
  "time",
  "servings",
  "difficulty",
  "temperature",
  "flavor",
  "image",
  "ingredients",
  "quantity",
  "unit",
  "name",
  "steps",
  "text",
  "tags",
  "notes",
  "recipeId",
  "value",
  "date",
  "meal",
  "listId",
  "label",
  "group",
  "checked",
  "start",
  "end",
  "rating",
  "experience",
  "changes",
  "preparationId",
  "q",
  "page",
  "limit",
  "category",
  "maxTime",
  "favorites",
  "sort",
  "include",
  "exclude",
  "filters",
  "w",
]);

export function errorDiagnostic(error: unknown) {
  let code = "UNEXPECTED";
  let validation: { field: string; type: string }[] | undefined;

  if (error instanceof ZodError) {
    code = "VALIDATION_ERROR";
    validation = error.issues
      .flatMap((issue) => {
        const safe = issue.path.every((part) =>
          typeof part === "number"
            ? Number.isInteger(part) && part >= 0 && part <= 10000
            : typeof part === "string" && safeFields.has(part),
        );

        return safe
          ? [{ field: issue.path.join(".") || "body", type: issue.code }]
          : [];
      })
      .slice(0, 10);
  } else if (error instanceof DomainError) {
    code =
      (
        {
          403: "FORBIDDEN",
          404: "NOT_FOUND",
          413: "PAYLOAD_TOO_LARGE",
          415: "UNSUPPORTED_MEDIA_TYPE",
        } as Record<number, string>
      )[error.status] ?? "DOMAIN_ERROR";
  } else {
    // Drivers podem encapsular a causa. Percurso limitado também suporta causas cíclicas.
    let cause: unknown = error;

    for (
      let depth = 0;
      depth < 5 && cause && typeof cause === "object";
      depth++
    ) {
      const candidate = "code" in cause ? cause.code : undefined;

      if (
        typeof candidate === "string" &&
        Object.hasOwn(diagnostics, candidate)
      ) {
        code = candidate;
        break;
      }

      cause = "cause" in cause ? cause.cause : undefined;
    }
  }

  const [cause, hint] = diagnostics[code];

  return { code, cause, hint, validation };
}
