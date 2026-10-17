import "dotenv/config";
import { defineConfig } from "prisma/config";
import { databaseUrl } from "./src/server/database/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // A ausência de .env não impede gerar o client nem validar o schema.
  datasource: {
    url: databaseUrl(
      process.env.MIGRATION_DATABASE_URL ||
        process.env.DATABASE_URL ||
        "postgresql://unconfigured:unconfigured@localhost:5432/unconfigured",
    ),
  },
});
