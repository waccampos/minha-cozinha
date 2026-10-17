import { healthy } from "@/server/services/health.service";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await healthy();

  return Response.json(
    { status: ok ? "ok" : "unavailable" },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
