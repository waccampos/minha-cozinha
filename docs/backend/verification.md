# Verificação — 17/10/2026

## Evidências locais

| Verificação                               | Resultado                                                        |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Testes de unidade, arquitetura e proteção | 22 passaram; 1 integração PostgreSQL ignorada explicitamente     |
| TypeScript                                | `npm run typecheck` sem erros                                    |
| ESLint e espaçamento                      | `npm run lint` sem erros ou avisos                               |
| Formatação                                | `npm run format:check` aprovado                                  |
| Prisma                                    | `npm run db:validate` aprovado; schema não aplicado ao servidor  |
| Next.js standalone                        | `npm run build` aprovado com a versão disponível no cache        |
| Compose                                   | Configuração validada com `.env.example`, sem subir containers   |
| Piso de segurança                         | Bloqueou corretamente Next 16.1.4; exige atualização documentada |

A refatoração removeu `src/features`, `src/data` e as pastas de domínio em `components`. Os testes de arquitetura verificam as fronteiras entre interface, schemas, serviços e repositórios. A remoção posterior da autenticação eliminou a rota de entrada e as rotas de sessão. As URLs funcionais e o visual das páginas foram preservados; não houve comparação visual automatizada neste ambiente.

A serialização do adapter PostgreSQL foi verificada com o adapter real e clientes simulados: consultas concorrentes na mesma transação, savepoints, liberação da conexão, recuperação após falha e paralelismo entre conexões diferentes. Esses testes não substituem a integração com PostgreSQL real. A fila contorna o [problema relatado no Prisma 7.5](https://github.com/prisma/orm/issues/29407), sem ocultar avisos do driver. Reinicie o processo Next.js após a atualização para substituir o cliente Prisma global em cache.

## Impedimentos externos

- TCP para `10.0.0.117:5432`: `Operation not permitted` (errno 1), antes da autenticação. A criação do banco e das roles foi posteriormente confirmada pela saída enviada pelo usuário, executada em seu terminal. Migrations e conexão de runtime não foram verificadas aqui.
- Docker: acesso ao daemon negado neste ambiente. Build da imagem, persistência após reinício e healthcheck no container não foram comprovados.
- DNS/registry indisponíveis: atualização para o Next corrigido e aquisição local dos assets originais permanecem pendentes. React e Sharp foram atualizados com os pacotes já disponíveis no cache.
- Backup/restauração: validações de manifesto, compatibilidade e escopo do arquivo foram testadas; exportação e restauração reais não foram executadas sem a conexão.

## Próximo passo operacional

Execute o [provisionamento](provisioning.md) em um host autorizado que alcance o PostgreSQL existente, com as credenciais administrativas recebidas apenas por variáveis de ambiente. A decisão posterior usa permissões por schema, sem alterar pg_hba.conf; as roles criadas pela versão anterior precisam ser habilitadas. Depois valide migrations, grants, integração, backup e restauração. O [README](../../README.md) contém a sequência de deploy e atualização de segurança.
