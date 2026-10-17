# Banco dedicado na instância existente

O pedido mais recente autoriza criar **um banco novo** `minha_cozinha` dentro da instância PostgreSQL existente em `10.0.0.117:5432`. Não autoriza instalar PostgreSQL, subir outro container de banco ou modificar bancos de outros projetos.

O usuário confirmou a criação do banco e das duas roles executando o script em seu terminal. A versão anterior deixou as roles em NOLOGIN; habilite-as com os comandos abaixo. A conexão direta deste ambiente continua bloqueada pelo sandbox. As credenciais administrativas não são gravadas pelo script.

## Executar em um host com acesso à instância

O comando de provisionamento usa `POSTGRES_USER` e `POSTGRES_PASSWORD` recebidos por variáveis de ambiente apenas nessa execução. Não coloque essas credenciais globais no `.env` da aplicação. `POSTGRES_HOST` e `POSTGRES_PORT` são opcionais; os padrões são o endereço informado e 5432.

```sh
npm ci
# Defina POSTGRES_USER e POSTGRES_PASSWORD no ambiente desta sessão protegida.
npm run db:provision
```

A rotina:

1. Verifica se banco e roles já existem e recusa redefini-los.
2. Gera senhas aleatórias diferentes para `minha_cozinha_app` e `minha_cozinha_migrator`.
3. Cria o banco `minha_cozinha`, com proprietário exclusivo de migração, e o schema `minha_cozinha`.
4. Retira permissões de PUBLIC **somente no banco recém-criado** e não altera outros bancos.
5. Concede ao runtime CONNECT no banco, USAGE no schema e DML/sequências nos objetos futuros, sem SUPERUSER, CREATEDB, CREATEROLE ou CREATE no schema.
6. Grava somente as novas URLs em `.env` com modo 0600. `.env.provision-pending` guarda as credenciais para recuperação de uma execução parcial; não o publique. Um `.env` preexistente não é sobrescrito.

A role de migração tem DDL apenas sobre o novo banco; a aplicação Docker recebe apenas `DATABASE_URL`. A conexão de migração fica no serviço tools. Após migrar, aplique `infra/grants.sql`, que também revoga o acesso de runtime à tabela de controle do Prisma.

## Permissões por schema, sem alterar o servidor

O provisionamento concede permissões de dados no schema `minha_cozinha`, sem editar `pg_hba.conf` ou restringir IPs. CONNECT herdado de PUBLIC em outros bancos não impede habilitar as roles. Isso não garante ausência de outros privilégios herdados de PUBLIC; o script não altera permissões de bancos de terceiros.

Para habilitar as roles já criadas, execute como administrador no Beekeeper:

```sql
ALTER ROLE minha_cozinha_app LOGIN;
ALTER ROLE minha_cozinha_migrator LOGIN;
```

Alternativamente, com as credenciais administrativas temporariamente no ambiente:

```sh
npm run db:provision -- --activate-existing
```

Execute as migrations com a conexão de migração do `.env`:

```sh
npm run db:migrate
```

Depois, conectado ao banco `minha_cozinha` no Beekeeper como administrador, conceda as permissões de runtime:

```sql
GRANT CONNECT ON DATABASE minha_cozinha TO minha_cozinha_app;
GRANT USAGE ON SCHEMA minha_cozinha TO minha_cozinha_app;

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA minha_cozinha
TO minha_cozinha_app;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA minha_cozinha
TO minha_cozinha_app;

REVOKE ALL ON TABLE minha_cozinha._prisma_migrations FROM minha_cozinha_app;

ALTER DEFAULT PRIVILEGES FOR ROLE minha_cozinha_migrator
IN SCHEMA minha_cozinha
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO minha_cozinha_app;

ALTER DEFAULT PRIVILEGES FOR ROLE minha_cozinha_migrator
IN SCHEMA minha_cozinha
GRANT USAGE, SELECT ON SEQUENCES TO minha_cozinha_app;
```

As permissões padrão aplicam-se aos objetos futuros criados pela role de migração. A revogação da tabela de controle do Prisma exige migrations já aplicadas. O script equivalente para psql é `infra/grants.sql`.

## Interrupção ou conflito

Não exclua nem recrie banco/roles automaticamente. Confira quais objetos foram criados nesta execução, preserve `.env.provision-pending` e corrija o ponto de falha. A rotina evita sobrescrever configurações existentes e não imprime senhas ou URLs. A criação foi confirmada pela saída enviada pelo usuário; migrations e acesso de runtime ainda precisam ser validados na infraestrutura.

Referências: [permissões padrão de PUBLIC no PostgreSQL](https://www.postgresql.org/docs/17/ddl-priv.html) e [permissões padrão para objetos futuros](https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html).
