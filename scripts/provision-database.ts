import "dotenv/config";

import { randomBytes } from "node:crypto";
import { readFile, writeFile, access } from "node:fs/promises";

import { Client } from "pg";

const database = "minha_cozinha";

const runtimeRole = "minha_cozinha_app";

const migrationRole = "minha_cozinha_migrator";

const activate = process.argv.includes("--activate-existing");

const adminUser = process.env.POSTGRES_USER;

const adminPassword = process.env.POSTGRES_PASSWORD;

if (!adminUser || !adminPassword) {
  console.error(
    "Defina POSTGRES_USER e POSTGRES_PASSWORD apenas para esta execução. Não os coloque no .env da aplicação.",
  );
  process.exit(1);
}

const admin = new Client({
  host: process.env.POSTGRES_HOST || "10.0.0.117",
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: "postgres",
  user: adminUser,
  password: adminPassword,
  connectionTimeoutMillis: 5000,
  application_name: "minha-cozinha-provision",
});

const identifier = (value: string) => `"${value.replace(/"/g, '""')}"`;

function connectionUrl(role: string, password: string) {
  const url = new URL("postgresql://localhost");
  url.hostname = process.env.POSTGRES_HOST || "10.0.0.117";
  url.port = process.env.POSTGRES_PORT || "5432";
  url.pathname = `/${database}`;
  url.username = role;
  url.password = password;
  url.searchParams.set("schema", "minha_cozinha");

  return url.toString();
}

async function exists(file: string) {
  try {
    await access(file);

    return true;
  } catch {
    return false;
  }
}

try {
  await admin.connect();

  if (activate) {
    // Habilitar somente as roles de um provisionamento anterior conhecido.
    const expected = await admin.query(
      `SELECT 1 FROM pg_database
       WHERE datname = $1 AND pg_get_userbyid(datdba) = $2`,
      [database, migrationRole],
    );

    if (!expected.rowCount) {
      throw new Error(
        "Banco/proprietário não correspondem ao provisionamento esperado.",
      );
    }

    await admin.query(`ALTER ROLE ${identifier(runtimeRole)} LOGIN`);
    await admin.query(`ALTER ROLE ${identifier(migrationRole)} LOGIN`);
    console.log(
      "Logins habilitados. As permissões de dados são concedidas no schema minha_cozinha; nenhuma configuração do servidor foi alterada.",
    );
  } else {
    const conflicts = await admin.query(
      `SELECT 1 FROM pg_database WHERE datname = $1
       UNION ALL SELECT 1 FROM pg_roles WHERE rolname = ANY($2::text[])`,
      [database, [runtimeRole, migrationRole]],
    );

    if (conflicts.rowCount) {
      throw new Error(
        "Banco ou roles já existem. Nenhuma redefinição automática será feita.",
      );
    }

    if (await exists(".env.provision-pending")) {
      throw new Error(
        "Há um provisionamento pendente. Revise-o antes de repetir.",
      );
    }

    const runtimePassword = randomBytes(32).toString("hex");
    const migrationPassword = randomBytes(32).toString("hex");
    const source = await readFile(
      (await exists(".env")) ? ".env" : ".env.example",
      "utf8",
    );

    if (await exists(".env")) {
      throw new Error(
        ".env já existe. Preserve sua configuração e execute o provisionamento em um diretório controlado antes de integrar as URLs manualmente.",
      );
    }

    const values = source
      .replace(
        /^DATABASE_URL=.*$/m,
        `DATABASE_URL="${connectionUrl(runtimeRole, runtimePassword)}"`,
      )
      .replace(
        /^# MIGRATION_DATABASE_URL=.*$/m,
        `MIGRATION_DATABASE_URL="${connectionUrl(migrationRole, migrationPassword)}"`,
      );

    // Guardar as novas credenciais antes de DDL permite recuperar uma execução interrompida.
    // As credenciais administrativas nunca são escritas.
    await writeFile(".env.provision-pending", values, {
      flag: "wx",
      mode: 0o600,
    });

    // Senhas são valores hexadecimais gerados acima, nunca entradas de usuário em SQL.
    await admin.query(
      `CREATE ROLE ${identifier(migrationRole)} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION PASSWORD '${migrationPassword}'`,
    );
    await admin.query(
      `CREATE ROLE ${identifier(runtimeRole)} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION CONNECTION LIMIT 8 PASSWORD '${runtimePassword}'`,
    );
    await admin.query(
      `CREATE DATABASE ${identifier(database)} OWNER ${identifier(migrationRole)}`,
    );
    await admin.query(
      `REVOKE ALL ON DATABASE ${identifier(database)} FROM PUBLIC`,
    );
    await admin.query(
      `GRANT CONNECT ON DATABASE ${identifier(database)} TO ${identifier(runtimeRole)}`,
    );

    const target = new Client({
      host: process.env.POSTGRES_HOST || "10.0.0.117",
      port: Number(process.env.POSTGRES_PORT || 5432),
      database,
      user: adminUser,
      password: adminPassword,
      connectionTimeoutMillis: 5000,
    });

    await target.connect();

    try {
      // Todas estas alterações são exclusivamente no banco recém-criado.
      await target.query("REVOKE ALL ON SCHEMA public FROM PUBLIC");
      // Extensões existentes no template podem manter funções/opclasses em public.
      // USAGE não concede CREATE nem acesso a tabelas de outros bancos.
      await target.query(
        `GRANT USAGE ON SCHEMA public TO ${identifier(runtimeRole)}, ${identifier(migrationRole)}`,
      );
      await target.query(
        `CREATE SCHEMA minha_cozinha AUTHORIZATION ${identifier(migrationRole)}`,
      );
      await target.query(
        `GRANT USAGE ON SCHEMA minha_cozinha TO ${identifier(runtimeRole)}`,
      );
      await target.query(
        `ALTER DEFAULT PRIVILEGES FOR ROLE ${identifier(migrationRole)} IN SCHEMA minha_cozinha GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${identifier(runtimeRole)}`,
      );
      await target.query(
        `ALTER DEFAULT PRIVILEGES FOR ROLE ${identifier(migrationRole)} IN SCHEMA minha_cozinha GRANT USAGE, SELECT ON SEQUENCES TO ${identifier(runtimeRole)}`,
      );
    } finally {
      await target.end();
    }

    await writeFile(".env", values, { flag: "wx", mode: 0o600 });

    await admin.query(`ALTER ROLE ${identifier(runtimeRole)} LOGIN`);
    await admin.query(`ALTER ROLE ${identifier(migrationRole)} LOGIN`);
    console.log(
      "Banco e credenciais criados; permissões de dados concedidas no schema minha_cozinha. Nenhuma configuração do servidor ou permissão de outros bancos foi alterada. Execute as migrations.",
    );

    console.log(
      "As novas URLs estão no .env (modo 0600). .env.provision-pending permite recuperação e pode ser removido manualmente após conferir a configuração.",
    );
  }
} catch {
  console.error(
    "Provisionamento não concluído. Verifique conectividade, permissões administrativas e possíveis objetos existentes. Não recrie nem exclua objetos automaticamente; confira .env.provision-pending se ele existir.",
  );
  process.exitCode = 1;
} finally {
  await admin.end().catch(() => {});
}
