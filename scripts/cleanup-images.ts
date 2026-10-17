import "dotenv/config";

import { getDb } from "../src/server/database/prisma";
import { cleanupImages } from "../src/server/services/image.service";

try {
  console.log(await cleanupImages());
} catch {
  console.error(
    "Falha ao limpar imagens. Verifique conexão e permissões do diretório.",
  );
  process.exitCode = 1;
} finally {
  try {
    await getDb().$disconnect();
  } catch {
    /* Sem client inicializado quando a configuração é inválida. */
  }
}
