import { withRequestLog } from "@/server/http";
import { healthy } from "@/server/services/health.service";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const GET = withRequestLog("/api/health", async () => {
  const ok = await healthy();

  return Response.json(
    { status: ok ? "ok" : "unavailable" },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
});
