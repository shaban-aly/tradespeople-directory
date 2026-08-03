import { NextRequest, NextResponse } from "next/server";
import { createServerReadClient } from "@/lib/db/client";
import { getClientIpFromRequest, rateLimitConsume } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 60;
const WINDOW_MS = 60_000;
const MAX_SLUG_LENGTH = 60;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Metric = "view" | "call" | "whatsapp";
type ErrorResponse = { error: string };

const METRICS: Metric[] = ["view", "call", "whatsapp"];

export async function POST(request: NextRequest) {
  let body: { slug?: unknown; type?: unknown };
  try {
    body = (await request.json()) as { slug?: unknown; type?: unknown };
  } catch {
    return NextResponse.json<ErrorResponse>({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const type = body.type;
  if (!slug || slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json<ErrorResponse>({ error: "slug غير صحيح" }, { status: 400 });
  }
  if (typeof type !== "string" || !METRICS.includes(type as Metric)) {
    return NextResponse.json<ErrorResponse>({ error: "نوع الحدث غير صحيح" }, { status: 400 });
  }

  const ip = getClientIpFromRequest(request);
  const { allowed } = await rateLimitConsume(`stats:${ip}:${slug}`, {
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!allowed) {
    return NextResponse.json<ErrorResponse>(
      { error: "طلبات كتير في وقت قصير — حاول بعد شوية" },
      { status: 429 },
    );
  }

  const { data, error } = await (
    createServerReadClient() as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
    }
  ).rpc("increment_craftsman_stat", {
    p_slug: slug,
    p_metric: type,
  });
  if (error) {
    return NextResponse.json<ErrorResponse>({ error: "فشل تسجيل الحدث" }, { status: 500 });
  }
  if (data === false) {
    return NextResponse.json<ErrorResponse>({ error: "الصنايعي غير موجود" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
