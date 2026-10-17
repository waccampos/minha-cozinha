-- Executar como proprietário do schema após migrations e após restaurações.
-- psql com variáveis runtime_role e migration_role, sem senha na linha de comando.
\set ON_ERROR_STOP on
GRANT USAGE ON SCHEMA minha_cozinha TO :"runtime_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA minha_cozinha TO :"runtime_role";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA minha_cozinha TO :"runtime_role";
REVOKE ALL ON TABLE minha_cozinha._prisma_migrations FROM :"runtime_role";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migration_role" IN SCHEMA minha_cozinha
 GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"runtime_role";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migration_role" IN SCHEMA minha_cozinha
 GRANT USAGE, SELECT ON SEQUENCES TO :"runtime_role";
