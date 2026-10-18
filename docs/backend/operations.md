> Atualização: foi autorizada a criação de um banco dedicado na instância existente. Veja [provisioning.md](provisioning.md). As instruções abaixo continuam válidas para schema, grants e operação após o provisionamento.

# Operação do PostgreSQL existente

## Logs da aplicação

Os logs são escritos em stdout/stderr. Por padrão, exibem horário UTC em ISO,
nível, mensagem em português, operação, rota, status e duração. Nas falhas,
incluem código, causa classificada e orientação para investigação. Erros de
validação mostram somente os nomes dos campos e o tipo da validação.

```text
2026-10-18T14:32:10.000Z WARN — Falha na requisição
  Operação: recipe.save
  Rota: POST /api/kitchen
  Status: 400
  Duração: 18 ms
  Requisição: 2a993090-3b8c-4e86-963b-39c885337296
  Código: VALIDATION_ERROR
  Causa: Campos inválidos na solicitação.
  Campos: values.title (too_small)
  Orientação: Confira os campos indicados e seus tipos no JSON ou formulário.
```

Configure no ambiente do servidor e reinicie o processo/container:

| Variável     | Valores                   | Padrão   |
| ------------ | ------------------------- | -------- |
| `LOG_FORMAT` | `pretty` ou `json`        | `pretty` |
| `LOG_LEVEL`  | `info`, `warn` ou `error` | `info`   |

`warn` oculta sucessos; `error` exibe somente falhas de servidor. Valores
inválidos usam os padrões. JSON produz um objeto por linha, adequado a
coletores. Essas opções afetam os logs da aplicação; o Next.js e outras
ferramentas podem imprimir suas próprias mensagens.

Para acompanhar a instalação Docker:

```sh
docker compose logs --follow --tail=100 app
```

Cada resposta de API contém `X-Request-Id`, gerado pelo servidor. Copie esse
valor da aba Network do navegador ou dos headers da resposta HTTP e procure
nos logs. Server Actions também geram um identificador para agrupar a operação
no servidor. Os tempos são medidos até a criação da resposta, sem incluir a
transferência pela rede.

O diagnóstico não registra payloads, valores dos campos, URLs reais, SQL,
cookies ou mensagens brutas de exceções. Uma falha não reconhecida aparece
como `UNEXPECTED`; use operação, código HTTP e identificador para investigá-la.
A verificação de saúde identifica `health.database` ou `health.storage` e
registra a falha quando refaz o diagnóstico, preservando o cache de dez segundos.

## Ferramentas Docker e engines do Prisma

O estágio base inclui OpenSSL antes da instalação de dependências para manter a detecção de plataforma consistente. O estágio tools prepara o engine do Prisma durante o build e valida o schema como UID 1001, o mesmo usuário definido no Compose. O diretório de engines e o HOME desse usuário permitem as gravações de cache necessárias. A validação do schema não aplica migrations nem conecta ao banco.

Após atualizar o Dockerfile, reconstrua `docker compose build tools` e execute `docker compose --profile tools run --rm tools npm run db:validate` antes de tentar migrations. Um erro de permissão em `/app/node_modules/@prisma/engines` deve ser corrigido na imagem; não altere as permissões do PostgreSQL, do diretório de dados do banco nem dos volumes de outras aplicações.

Não há serviço PostgreSQL no Compose. O código força o schema `minha_cozinha` tanto no client quanto nas migrations. Nunca use `prisma migrate reset`, `db push --accept-data-loss` ou `DROP SCHEMA ... CASCADE` no banco compartilhado.

## Preparação pelo administrador

Escolha o banco existente e duas roles novas sem associação a roles de outros projetos. Os nomes abaixo são sugestões; senhas são configuradas pelo administrador com `\password`, nunca versionadas.

```sql
CREATE ROLE minha_cozinha_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE minha_cozinha_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
-- No banco existente, conectado como administrador:
CREATE SCHEMA minha_cozinha AUTHORIZATION minha_cozinha_migrator;
```

Use `minha_cozinha_migrator` em `MIGRATION_DATABASE_URL` e a role `minha_cozinha_app` em `DATABASE_URL`. A role de runtime não recebe CREATE no schema nem propriedade de tabelas. O proprietário deve poder criar objetos apenas neste schema. Confirme que as roles não herdam permissões de outras aplicações ou permissões concedidas a PUBLIC. Não revogue grants globais em um banco compartilhado para corrigir isso sem analisar os outros projetos.

Depois de aplicar migrations, execute `infra/grants.sql` como proprietário, definindo `runtime_role=minha_cozinha_app` e `migration_role=minha_cozinha_migrator`. Use `.pgpass` com modo 0600 ou mecanismo de segredos local; não coloque senha em argumentos do shell.

```sh
psql -h IP_DO_POSTGRES -U minha_cozinha_migrator -d BANCO_EXISTENTE \
  -v runtime_role=minha_cozinha_app -v migration_role=minha_cozinha_migrator \
  -f infra/grants.sql
```

O script não concede acesso de runtime à tabela de migrations. Reaplique após restaurar um dump, pois a restauração ignora ACLs e mantém a propriedade do usuário restaurador.

## Máquinas diferentes

`DATABASE_URL` usa o IP/DNS da máquina PostgreSQL; `localhost` dentro do container é o próprio container. Configure o PostgreSQL existente para aceitar somente o IP de saída do host Docker (verifique NAT/roteamento), com regra específica de `pg_hba.conf`, banco e role da aplicação. Prefira `hostssl` com SCRAM e certificado validável. Não use `trust`, `0.0.0.0/0` ou redirecionamento de porta do roteador. Restrinja 5432 no firewall do banco ao host da aplicação.

Ajustes de `listen_addresses`, TLS e `pg_hba.conf` devem ser feitos pelo responsável pela instância existente, sem substituir os arquivos nem remover regras de outros projetos. Teste a conexão antes de alterar a aplicação. Com TLS, configure `sslmode=verify-full` e a CA correspondente; não use `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## Pesquisa e índices

A migration cria índices de categoria, tempo, temperatura/sabor, avaliação, relações, datas e full-text search normalizado (`simple`, preservando nomes de ingredientes). A normalização remove acentos e aplica sinônimos antes da gravação e da pesquisa. Parâmetros de consultas não são interpolados em SQL.

`pg_trgm` não é instalado pela aplicação. Se já existir, a migration cria um índice GIN com a opclass do schema da extensão. A busca usa o operador de similaridade de palavras com ranking combinado e os filtros de exclusão permanecem obrigatórios. Se a extensão for habilitada posteriormente pelo administrador, ele pode criar o índice correspondente **somente na tabela da aplicação**, sem reiniciar ou recriar PostgreSQL. Sem a extensão, FTS e comparação textual continuam funcionando.

Use `EXPLAIN (ANALYZE, BUFFERS)` em dados representativos antes de ajustar índices. Não há medidas de latência real enquanto a conexão de produção não estiver disponível. As estatísticas são mantidas pelo autovacuum da instância existente; não altere sua configuração global pela aplicação.
