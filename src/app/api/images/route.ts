import { assertSameOrigin, errorResponse } from "@/server/http";
import { uploadImage } from "@/server/services/image.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    return Response.json(await uploadImage(request), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
