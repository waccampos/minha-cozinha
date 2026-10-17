import { randomUUID } from "node:crypto";
import {
  mkdir,
  copyFile,
  writeFile,
  rename,
  rm,
  lstat,
} from "node:fs/promises";
import path from "node:path";

import { imageDirectory } from "../src/server/storage/config";
import { imageFileName } from "../src/server/storage/image-validation";
import { backupRoot, locked, run, digest } from "./backup-common";
import { backupManifest } from "./backup-manifest";

const id =
  new Date().toISOString().replace(/[:.]/g, "-") +
  "-" +
  randomUUID().slice(0, 8);

const staging = path.join(backupRoot(), ".incomplete-" + id);

const target = path.join(backupRoot(), id);

try {
  await locked(async (client, env) => {
    await mkdir(path.join(staging, "images"), { recursive: true, mode: 0o700 });

    const dump = path.join(staging, "database.dump");
    await run(
      "pg_dump",
      [
        "--format=custom",
        "--schema=minha_cozinha",
        "--no-owner",
        "--no-acl",
        "--file",
        dump,
      ],
      env,
    );

    const major = Number(
      (await client.query("SHOW server_version_num")).rows[0]
        .server_version_num,
    );

    const migrations = (
      await client.query<{ migration_name: string }>(
        "SELECT migration_name FROM minha_cozinha._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name",
      )
    ).rows.map((m) => m.migration_name);

    const images = (
      await client.query<{ fileName: string }>(
        'SELECT "fileName" FROM minha_cozinha."Image"',
      )
    ).rows;

    const files = [];

    for (const row of images) {
      const name = imageFileName(row.fileName);
      const source = path.join(imageDirectory(), name);

      if (!(await lstat(source)).isFile())
        throw new Error("Arquivo de imagem inválido.");

      const dest = path.join(staging, "images", name);
      await copyFile(source, dest);
      files.push({ name, sha256: await digest(dest) });
    }

    await writeFile(
      path.join(staging, "manifest.json"),
      JSON.stringify(
        backupManifest.parse({
          version: 1,
          schema: "minha_cozinha",
          createdAt: new Date().toISOString(),
          postgresMajor: Math.floor(major / 10000),
          migrations,
          database: { file: "database.dump", sha256: await digest(dump) },
          images: files,
        }),
        null,
        2,
      ),
      { mode: 0o600 },
    );
    await rename(staging, target);
  });
  console.log(`Backup concluído: ${target}`);
} catch {
  await rm(staging, { recursive: true, force: true }).catch(() => {});
  console.error(
    "Backup não concluído. Verifique conexão, pg_dump, permissões e integridade dos arquivos. Nenhum backup incompleto deve ser usado.",
  );
  process.exitCode = 1;
}
