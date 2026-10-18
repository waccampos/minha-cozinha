# Logs legíveis para diagnóstico

## Problema

O logger atual imprime JSON compacto com evento, nível e poucos campos.
Falhas HTTP não identificam a rota ou o comando. Erros de validação e de
domínio recebem `UNEXPECTED`, dificultando distinguir entrada inválida,
regra de negócio e indisponibilidade de infraestrutura.

## Proposta

Manter o logger central existente, sem novas dependências, com saída legível
por padrão e saída estruturada selecionada por `LOG_FORMAT=json`.
`LOG_FORMAT=pretty` seleciona explicitamente o formato legível. Valores
ausentes ou inválidos usam `pretty`.

Exemplo ilustrativo de saída:

```text
2026-10-18T14:32:10.000Z WARN  Cadastro de receita recusado
  operação: recipe.save | rota: POST /api/kitchen
  status: 400 | duração: 18 ms | requisição: 2a993090-3b8c-4e86-963b-39c885337296
  código: VALIDATION_ERROR | campos: values.title, values.ingredients
```

Alternativas consideradas: apenas identar JSON preservaria a estrutura, mas
continuaria pouco amigável; imprimir somente texto dificultaria coleta por
ferramentas. Os dois formatos compartilham o mesmo registro e diagnóstico.

## Escopo

- HTTP: instrumentar os handlers existentes de cozinha, receitas, busca,
  despensa, imagens e health com método, rota estática, identificador gerado
  pelo servidor, duração, status e resultado.
- Respostas HTTP: retornar o identificador em `X-Request-Id`, inclusive em
  erros, sem alterar o formato do corpo de resposta.
- Server Actions: identificar o comando validado e a duração tanto em sucesso
  quanto em falha; entradas inválidas usam um nome fixo de operação.
- Saúde: identificar se o teste que falhou foi banco ou armazenamento,
  preservando o cache de dez segundos.
- Classificar validação, erros de domínio, Prisma, rede, armazenamento e
  erros inesperados, com descrições e orientações fixas em português.
- Usar `warn` para falhas de cliente (4xx) e `error` para falhas de servidor
  (5xx); registrar sucessos em `info`. Health saudável não precisa gerar
  uma linha por verificação.
- Oferecer `LOG_LEVEL=info|warn|error`, padrão `info`, para controlar volume.

## Dados registrados

Usar lista explícita de campos. Nunca imprimir payloads, receitas, nomes de
arquivos enviados, cabeçalhos, cookies, credenciais, URLs completas, SQL ou
mensagens arbitrárias de exceções. Rotas usam templates como
`/api/recipes/[id]`, sem query string. Identificadores de requisição são
gerados no servidor, sem confiar em valores enviados pelo cliente.

Erros Zod incluem somente caminhos de campos conhecidos e o tipo da
validação, com limite de dez itens; propriedades desconhecidas são omitidas.
Mensagens diagnósticas e orientações vêm de um catálogo controlado, sem
interpolar valores da entrada nem mensagens brutas do Prisma/driver.

## Implementação e validação planejadas

Evoluir `src/server/logger.ts` e criar um helper HTTP compartilhado para
evitar duplicação e manter os handlers do App Router compatíveis. Reutilizar
`publicError` para status e respostas; o diagnóstico interno é independente
da mensagem pública. Preservar a validação de origem e os limites de upload.

Testes devem cobrir os dois formatos, filtro por nível, severidade, duração,
correlação entre resposta e log, identificação de comando, classificação de
erros e ausência de valores sensíveis. Executar testes existentes, lint e
TypeScript. Documentar variáveis e exemplos em `docs/backend/operations.md`
e `.env.example`.

Não incluir dashboard, serviço externo, persistência em arquivo ou alertas
nesta alteração. O destino continua sendo stdout/stderr, coletável pelo
ambiente atual.
