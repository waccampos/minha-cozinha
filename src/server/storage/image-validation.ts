const MAX_BYTES = 5 * 1024 * 1024;

export function inspectImage(bytes: Buffer, mime: string) {
  if (!bytes.length || bytes.length > MAX_BYTES)
    throw new Error("Envie uma imagem de até 5 MB.");

  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  if (
    (!png && !jpeg) ||
    (png && mime !== "image/png") ||
    (jpeg && mime !== "image/jpeg")
  )
    throw new Error("O arquivo deve ser uma imagem JPEG ou PNG válida.");

  return png ? "png" : "jpeg";
}

export function imageFileName(value: string): string {
  if (!/^[a-f0-9-]{36}\.(jpg|png)$/.test(value))
    throw new Error("Nome de imagem inválido.");

  return value;
}

export const maxUploadBytes = MAX_BYTES;
