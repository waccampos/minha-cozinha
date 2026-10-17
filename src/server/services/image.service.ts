import "server-only";

import { randomUUID } from "node:crypto";

import { DomainError } from "@/lib/errors";
import { writeTransaction, type Transaction } from "@/server/database/prisma";
import * as images from "@/server/repositories/image.repository";
import * as storage from "@/server/storage/image-storage";
import {
  imageFileName,
  maxUploadBytes,
} from "@/server/storage/image-validation";

export async function resolveImageId(tx: Transaction, path: string) {
  if (!path) return null;

  const id = path.slice("/api/images/".length);

  if (!(await images.findImage(id, tx))) {
    throw new DomainError(
      "A imagem não foi encontrada. Envie a fotografia novamente.",
    );
  }

  return id;
}

export async function uploadImage(request: Request) {
  const length = Number(request.headers.get("content-length"));

  if (length > maxUploadBytes) {
    throw new DomainError("Envie uma imagem de até 5 MB.", 413);
  }

  const reader = request.body?.getReader();

  if (!reader) throw new DomainError("Envie uma imagem.");

  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    size += value.length;

    if (size > maxUploadBytes) {
      await reader.cancel();
      throw new DomainError("Envie uma imagem de até 5 MB.", 413);
    }

    chunks.push(value);
  }

  const encoded = await storage.encodeImage(
    Buffer.concat(chunks),
    request.headers.get("content-type") ?? "",
  );

  const id = randomUUID();
  const fileName = imageFileName(
    `${id}.${encoded.format === "png" ? "png" : "jpg"}`,
  );

  let written = false;

  try {
    await writeTransaction(async (tx) => {
      await storage.storeImageFile(fileName, encoded.bytes);
      written = true;

      await images.createImage(tx, {
        id,
        fileName,
        mimeType: encoded.format === "png" ? "image/png" : "image/jpeg",
        bytes: encoded.bytes.length,
        width: encoded.width,
        height: encoded.height,
      });
    });
  } catch (error) {
    if (written) await storage.removeImageFile(fileName).catch(() => {});

    throw error;
  }

  return {
    id,
    path: `/api/images/${id}`,
    width: encoded.width,
    height: encoded.height,
    bytes: encoded.bytes.length,
  };
}

export async function readImage(id: string) {
  const image = await images.findImage(id);

  if (!image) throw new DomainError("Imagem não encontrada.", 404);

  return { image, bytes: await storage.readImageFile(image.fileName) };
}

export async function thumbnail(id: string, width: number) {
  const image = await images.findImage(id);

  if (!image) throw new DomainError("Imagem não encontrada.", 404);

  return storage.imageThumbnail(image, width);
}

export async function cleanupImages() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return writeTransaction(async (tx) => {
    const unused = await images.unusedImages(tx, cutoff);

    for (const image of unused) {
      await storage.removeImageFile(image.fileName);
      await storage.removeImageThumbnails(image.id);
      await images.deleteImage(tx, image.id);
    }

    const known = await images.imageFileNames(tx);
    const orphans = await storage.removeOrphanImageFiles(known, cutoff);

    return { removed: unused.length, orphans };
  });
}
