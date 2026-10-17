import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import {
  mkdir,
  readdir,
  readFile,
  copyFile,
  rename,
  rm,
  lstat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { imageDirectory } from "../src/server/storage/config";
import { backupRoot, locked, run, digest } from "./backup-common";
import {
  backupManifest,
  checkCompatibility,
  validateArchiveToc,
} from "./backup-manifest";

const name = process.argv[2];

if (
  !name ||
  !process.argv.includes("--confirm-restore") ||
  !/^\d{4}-[a-zA-Z0-9T-]+$/.test(name)
) {
  console.error(
    "Uso: npm run restore -- NOME_DO_BACKUP --confirm-restore. Pare a aplicação e faça um backup atual antes de restaurar.",
  );
  process.exit(1);
}

const source = path.join(backupRoot(), name);

const directory = imageDirectory();

const staged = directory + ".restore-" + randomUUID();

const previous = directory + ".previous-" + randomUUID();

const marker = directory + ".maintenance";

let databaseRestored = false;

let markerCreated = false;

try {
  const manifest = backupManifest.parse(
    JSON.parse(await readFile(path.join(source, "manifest.json"), "utf8")),
  );

  const dump = path.join(source, "database.dump");

  if ((await digest(dump)) !== manifest.database.sha256)
    throw new Error("Checksum do banco inválido.");

  await mkdir(staged, { recursive: true, mode: 0o750 });

  for (const image of manifest.images) {
    const file = path.join(source, "images", image.name);

    if (!(await lstat(file)).isFile() || (await digest(file)) !== image.sha256)
      throw new Error("Checksum da imagem inválido.");

    await copyFile(file, path.join(staged, image.name));
  }

  await locked(async (client, env) => {
    const major = Number(
      (await client.query("SHOW server_version_num")).rows[0]
        .server_version_num,
    );

    checkCompatibility(
      manifest,
      Math.floor(major / 10000),
      (await readdir("prisma/migrations")).filter((n) => !n.endsWith(".toml")),
    );

    const toc = await run("pg_restore", ["--list", dump], env);

    validateArchiveToc(toc);

    // A criação exclusiva do marcador impede duas restaurações e bloqueia a aplicação.
    await writeFile(
      marker,
      "Restauração em andamento. Não remova antes de conferir banco e imagens.\n",
      { flag: "wx", mode: 0o600 },
    );
    markerCreated = true;
    await run(
      "pg_restore",
      [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-acl",
        "--single-transaction",
        "--exit-on-error",
        "--schema=minha_cozinha",
        dump,
      ],
      env,
    );
    databaseRestored = true;

    // Conferir que todos os caminhos restaurados correspondem ao manifesto.
    const images = (
      await client.query<{ fileName: string }>(
        'SELECT "fileName" FROM minha_cozinha."Image"',
      )
    ).rows;

    const names = new Set(manifest.images.map((i) => i.name));

    if (images.some((i) => !names.has(i.fileName)))
      throw new Error("Imagens restauradas não correspondem ao banco.");

    if (existsSync(directory)) await rename(directory, previous);

    await rename(staged, directory);
    await rm(marker);
  });
  console.log(
    `Restauração concluída. Arquivos anteriores preservados em ${previous}. Reaplique os grants de runtime conforme a documentação e inicie a aplicação.`,
  );
} catch {
  await rm(staged, { recursive: true, force: true }).catch(() => {});

  if (!databaseRestored && markerCreated)
    await rm(marker, { force: true }).catch(() => {});

  console.error(
    databaseRestored
      ? "Banco restaurado, mas a troca de imagens falhou. Mantenha a aplicação parada. O marcador de manutenção foi preservado; restaure images/ do backup para IMAGE_STORAGE_DIR, confira os dados e remova o marcador somente após reparar."
      : "Restauração não concluída. Verifique integridade, permissões e conexão.",
  );
  process.exitCode = 1;
}
