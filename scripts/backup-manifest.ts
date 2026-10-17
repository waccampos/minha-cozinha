import { z } from "zod";

import { imageFileName } from "../src/server/storage/image-validation";

const sha = z.string().regex(/^[a-f0-9]{64}$/);

export const backupManifest = z.object({
  version: z.literal(1),
  schema: z.literal("minha_cozinha"),
  createdAt: z.iso.datetime(),
  postgresMajor: z.number().int().min(14),
  migrations: z.array(z.string().regex(/^\d{12,}_[a-zA-Z0-9_-]+$/)).min(1),
  database: z.object({ file: z.literal("database.dump"), sha256: sha }),
  images: z
    .array(
      z.object({
        name: z.string().refine((s) => {
          try {
            return !!imageFileName(s);
          } catch {
            return false;
          }
        }),
        sha256: sha,
      }),
    )
    .max(100000),
});

export function checkCompatibility(
  manifest: z.infer<typeof backupManifest>,
  targetMajor: number,
  knownMigrations: string[],
) {
  if (targetMajor < manifest.postgresMajor)
    throw new Error("Não restaure para uma versão anterior do PostgreSQL.");

  if (manifest.migrations.some((m) => !knownMigrations.includes(m)))
    throw new Error(
      "Backup foi criado por uma versão mais recente ou incompatível da aplicação.",
    );

  if (
    new Set(manifest.images.map((i) => i.name)).size !== manifest.images.length
  )
    throw new Error("Manifesto possui imagens duplicadas.");
}

export function validateArchiveToc(toc: string) {
  const metadata = /^(ENCODING|STDSTRINGS|SEARCHPATH) - /;
  const schema = /^SCHEMA - minha_cozinha(?:\s|$)/;
  const schemaComment = /^COMMENT - SCHEMA minha_cozinha(?:\s|$)/;
  const object =
    /^(TABLE DATA|TABLE|SEQUENCE SET|SEQUENCE OWNED BY|SEQUENCE|FK CONSTRAINT|CONSTRAINT|INDEX|DEFAULT|TRIGGER|COMMENT) minha_cozinha /;

  for (const line of toc.split("\n")) {
    const entry = line.match(/^\d+;\s+\d+\s+\d+\s+(.+)$/)?.[1];

    if (!entry) continue;

    if (
      !metadata.test(entry) &&
      !schema.test(entry) &&
      !schemaComment.test(entry) &&
      !object.test(entry)
    ) {
      throw new Error(
        "Backup contém objetos fora da aplicação ou tipos não suportados.",
      );
    }
  }
}
