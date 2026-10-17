import { z } from "zod";

import { errorResponse } from "@/server/http";
import { readImage, thumbnail } from "@/server/services/image.service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    z.uuid().parse(id);

    const width = new URL(request.url).searchParams.get("w");

    if (width) {
      const size = z.coerce
        .number()
        .pipe(
          z.union([
            z.literal(320),
            z.literal(640),
            z.literal(960),
            z.literal(1600),
          ]),
        )
        .parse(width);

      return new Response(new Uint8Array(await thumbnail(id, size)), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const { image, bytes } = await readImage(id);

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Disposition": `inline; filename="${image.fileName}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
