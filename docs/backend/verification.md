# Verificação — 17/10/2026

## Evidências locais

| Verificação                               | Resultado                                                        |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Testes de unidade, arquitetura e proteção | 30 passaram; 1 integração PostgreSQL ignorada explicitamente     |
| TypeScript                                | `npm run typecheck` sem erros                                    |
| ESLint e espaçamento                      | `npm run lint` sem erros ou avisos                               |
| Formatação                                | `npm run format:check` aprovado                                  |
| Prisma                                    | `npm run db:validate` aprovado; schema não aplicado ao servidor  |
| Next.js standalone                        | `npm run build` aprovado com a versão disponível no cache        |
| Compose                                   | Configuração validada com `.env.example`, sem subir containers   |
| Piso de segurança                         | Bloqueou corretamente Next 16.1.4; exige atualização documentada |

A refatoração removeu `src/features`, `src/data` e as pastas de domínio em `components`. Os testes de arquitetura verificam as fronteiras entre interface, schemas, serviços e repositórios. A remoção posterior da autenticação eliminou a rota de entrada e as rotas de sessão. As URLs funcionais e o visual das páginas foram preservados; não houve comparação visual automatizada neste ambiente.

A serialização do adapter PostgreSQL foi verificada com o adapter real e clientes simulados: consultas concorrentes na mesma transação, savepoints, liberação da conexão, recuperação após falha e paralelismo entre conexões diferentes. Esses testes não substituem a integração com PostgreSQL real. A fila contorna o [problema relatado no Prisma 7.5](https://github.com/prisma/orm/issues/29407), sem ocultar avisos do driver. Reinicie o processo Next.js após a atualização para substituir o cliente Prisma global em cache.

A alteração de múltiplas categorias foi verificada por testes de schemas, interpretação da busca, serviços com transação simulada, montagem de consultas, contadores e DTOs. Foram cobertas edição dos vínculos, recusa de categoria inexistente antes da escrita, renomeação e remoção explícita dos filtros da busca. O teste de integração real foi ampliado para duas categorias, filtros por ambas, pesquisa conjunta e proteção de categorias em uso, mas permanece ignorado neste ambiente. A migration de backfill não foi aplicada ao PostgreSQL; seu procedimento de manutenção está em [multiple-categories.md](multiple-categories.md).

## Impedimentos externos

- TCP para `10.0.0.117:5432`: `Operation not permitted` (errno 1), antes da autenticação. A criação do banco e das roles foi posteriormente confirmada pela saída enviada pelo usuário, executada em seu terminal. Migrations e conexão de runtime não foram verificadas aqui.
- Docker: acesso ao daemon negado neste ambiente. Build da imagem, persistência após reinício e healthcheck no container não foram comprovados.
- DNS/registry indisponíveis: atualização para o Next corrigido e aquisição local dos assets originais permanecem pendentes. React e Sharp foram atualizados com os pacotes já disponíveis no cache.
- Backup/restauração: validações de manifesto, compatibilidade e escopo do arquivo foram testadas; exportação e restauração reais não foram executadas sem a conexão.

## Próximo passo operacional

O usuário já confirmou o provisionamento na instância existente e iniciou a preparação do homelab. Não execute db:provision novamente. O PostgreSQL informado no Orange Pi é 16. A atualização de segurança passou no terminal externo; o último relatório de audit ainda requer as correções orientadas. Preserve o lockfile atualizado do homelab.

Sincronize o código novo, conclua a auditoria e valide o build no servidor. Antes de subir a aplicação, faça backup, interrompa gravações e siga [a migration para múltiplas categorias](multiple-categories.md). Confirme os grants, o healthcheck, os dados antigos e o cadastro com duas categorias. A integração, o backup/restauração e a persistência real em Docker ainda dependem da execução no servidor autorizado.
