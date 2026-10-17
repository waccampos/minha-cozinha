import { readFile, lstat, readdir } from "node:fs/promises";
import path from "node:path";

import { backupRoot, digest } from "./backup-common";
import { backupManifest } from "./backup-manifest";

const name = process.argv[2];

if (!name || !/^\d{4}-[a-zA-Z0-9T-]+$/.test(name)) {
  console.error("Uso: npm run backup:verify -- NOME_DO_BACKUP");
  process.exit(1);
}

try {
  const source = path.join(backupRoot(), name);
  const manifest = backupManifest.parse(
    JSON.parse(await readFile(path.join(source, "manifest.json"), "utf8")),
  );

  const known = await readdir("prisma/migrations");

  if (manifest.migrations.some((m) => !known.includes(m)))
    throw new Error("Versão incompatível.");

  if (
    (await digest(path.join(source, "database.dump"))) !==
    manifest.database.sha256
  )
    throw new Error("Banco com checksum inválido.");

  for (const image of manifest.images) {
    const file = path.join(source, "images", image.name);

    if (!(await lstat(file)).isFile() || (await digest(file)) !== image.sha256)
      throw new Error("Imagem com checksum inválido.");
  }

  console.log(
    `Integridade verificada: arquivo do banco e ${manifest.images.length} imagens. Formato de backup 1; PostgreSQL de origem ${manifest.postgresMajor}. Isso não substitui um teste de restauração.`,
  );
} catch {
  console.error(
    "Backup inválido, incompleto ou incompatível com este código. Não restaure.",
  );
  process.exitCode = 1;
}
