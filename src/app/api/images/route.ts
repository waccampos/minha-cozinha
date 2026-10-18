import { withRequestLog } from "@/server/http";
import { uploadImage } from "@/server/services/image.service";

export const runtime = "nodejs";

export const POST = withRequestLog("/api/images", async (request) => {
  return Response.json(await uploadImage(request), { status: 201 });
});
