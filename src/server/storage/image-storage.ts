import "server-only";

import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { DomainError } from "@/lib/errors";

import { imageDirectory } from "./config";
import { imageFileName, inspectImage, maxUploadBytes } from "./image-validation";

export async function encodeImage(bytes: Buffer, mime: string) {
  let format: "png" | "jpeg";

  try {
    format = inspectImage(bytes, mime);
  } catch (error) {
    throw new DomainError((error as Error).message);
  }

  try {
    const pipeline = sharp(bytes, { limitInputPixels: 20_000_000, failOn: "warning", animated: false });
    const metadata = await pipeline.metadata();

    if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) {
      throw new Error("Invalid image");
    }

    const result = await (format === "png" ? pipeline.rotate().png() : pipeline.rotate().jpeg({ quality: 90 })).toBuffer({ resolveWithObject: true });

    if (result.data.length > maxUploadBytes) {
      throw new Error("Too large");
    }

    return { bytes: result.data, format, width: result.info.width, height: result.info.height };
  } catch {
    throw new DomainError("Imagem inválida ou muito grande. Use JPEG/PNG de até 5 MB e 20 megapixels.");
  }
}

export async function storeImageFile(fileName: string, bytes: Buffer) {
  await mkdir(imageDirectory(), { recursive: true, mode: 0o750 });
  await writeFile(path.join(imageDirectory(), imageFileName(fileName)), bytes, { flag: "wx", mode: 0o640 });
}

export async function readImageFile(fileName: string) {
  try {
    return await readFile(path.join(imageDirectory(), imageFileName(fileName)), { flag: constants.O_RDONLY | constants.O_NOFOLLOW });
  } catch {
    throw new DomainError("Arquivo de imagem não encontrado no armazenamento.", 404);
  }
}

async function removeFile(file: string) {
  await unlink(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export async function removeImageFile(fileName: string) {
  await removeFile(path.join(imageDirectory(), imageFileName(fileName)));
}

export async function removeImageThumbnails(id: string) {
  for (const width of [320, 640, 960, 1600]) {
    await removeFile(path.join(imageDirectory(), ".cache", `${id}-${width}.webp`));
  }
}

export async function removeOrphanImageFiles(known: Set<string>, cutoff: Date) {
  const entries = await readdir(imageDirectory()).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [] as string[];

    throw error;
  });

  let removed = 0;

  for (const entry of entries) {
    try {
      imageFileName(entry);
    } catch {
      continue;
    }

    if (known.has(entry)) continue;

    const file = path.join(imageDirectory(), entry);
    const info = await stat(file);

    if (info.mtime < cutoff && info.isFile()) {
      await unlink(file);
      removed++;
    }
  }

  return removed;
}

export async function imageThumbnail(image: { id: string; fileName: string }, width: number) {
  const directory = path.join(imageDirectory(), ".cache");
  const target = path.join(directory, `${image.id}-${width}.webp`);

  try {
    return await readFile(target, { flag: constants.O_RDONLY | constants.O_NOFOLLOW });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const bytes = await readImageFile(image.fileName);
  const output = await sharp(bytes, { limitInputPixels: 20_000_000 }).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();

  await mkdir(directory, { recursive: true, mode: 0o750 });
  await writeFile(target, output, { flag: "wx", mode: 0o640 }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "EEXIST") throw error;
  });

  return output;
}

export async function checkImageStorage() {
  await mkdir(imageDirectory(), { recursive: true, mode: 0o750 });

  const probe = path.join(imageDirectory(), ".health-" + randomUUID());

  await writeFile(probe, "", { flag: "wx", mode: 0o600 });
  await unlink(probe);
}
