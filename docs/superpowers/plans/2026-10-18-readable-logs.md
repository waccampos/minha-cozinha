# Plano de implementação: logs legíveis

Spec: `docs/superpowers/specs/2026-10-18-readable-logs-design.md`.
Execução nesta sessão, autorizada pelo usuário após revisão do desenho.

- [x] Testar e implementar logger: texto/JSON, níveis, catálogo de diagnóstico,
      campos de validação seguros e contexto isolado por requisição.
- [x] Testar e integrar wrapper HTTP, comandos de cozinha, Server Actions e
      diagnóstico de saúde, preservando respostas e validações atuais.
- [x] Documentar configuração e consulta dos logs; executar testes, lint,
      TypeScript e build, revisar o diff.

Arquivos: `src/server/logger.ts`, `src/server/log-context.ts`,
`src/server/log-diagnostics.ts`, `src/server/http.ts`, handlers existentes de
`src/app/api`, `src/actions/kitchen.actions.ts`, serviço de saúde,
`tests/logging.test.ts`, `.env.example` e `docs/backend/operations.md`.

Verificação: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
Não registrar mensagens arbitrárias de exceções, payloads, URLs, SQL ou
cabeçalhos. Preservar mudanças locais anteriores.

Resultado: 45 testes passaram; o teste de integração PostgreSQL permaneceu
desativado por configuração. Lint e build passaram. Revisão independente
identificou evento do hook `src/instrumentation.ts` ausente do catálogo;
corrigido antes do build final. Testes adicionais cobrem saúde, cache,
recuperação e diagnóstico do volume de imagens.
