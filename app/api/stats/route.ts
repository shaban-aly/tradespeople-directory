import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerReadClient } from "@/lib/db/client";
import { getClientIpFromRequest, rateLimitConsume } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 60;
const WINDOW_MS = 60_000;
const MAX_SLUG_LENGTH = 60;
const MAX_DEVICE_ID_LENGTH = 200;
const MAX_SESSION_ID_LENGTH = 64;
const MAX_PATH_LENGTH = 200;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

type Metric = "view" | "call" | "whatsapp";
type ErrorResponse = { error: string };

const METRICS: Metric[] = ["view", "call", "whatsapp"];

function makeDeviceKey(deviceId: string, ip: string): string {
  return createHash("sha256")
    .update(`${ip}|${deviceId}`)
    .digest("hex");
}

function sanitizePath(value: unknown): string {
  if (typeof value !== "string") return "";
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_PATH_LENGTH);
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

export async function POST(request: NextRequest) {
  let body: {
    slug?: unknown;
    type?: unknown;
    deviceId?: unknown;
    sessionId?: unknown;
    path?: unknown;
  };
  try {
    body = (await request.json()) as {
      slug?: unknown;
      type?: unknown;
      deviceId?: unknown;
      sessionId?: unknown;
      path?: unknown;
    };
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
  const deviceId =
    typeof body.deviceId === "string"
      ? body.deviceId.trim().slice(0, MAX_DEVICE_ID_LENGTH)
      : "";
  if (!deviceId || !DEVICE_ID_PATTERN.test(deviceId)) {
    return NextResponse.json<ErrorResponse>({ error: "معرف الجهاز غير صحيح" }, { status: 400 });
  }
  const sessionId =
    typeof body.sessionId === "string"
      ? body.sessionId.trim().slice(0, MAX_SESSION_ID_LENGTH)
      : "";
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json<ErrorResponse>({ error: "معرف الجلسة غير صحيح" }, { status: 400 });
  }
  const path = sanitizePath(body.path);

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
  ).rpc("record_craftsman_event", {
    p_slug: slug,
    p_metric: type,
    p_device_key: makeDeviceKey(deviceId, ip),
    p_session_id: sessionId,
    p_path: path,
  });
  if (error) {
    return NextResponse.json<ErrorResponse>({ error: "فشل تسجيل الحدث" }, { status: 500 });
  }
  if (data === false) {
    return NextResponse.json<ErrorResponse>(
      { error: "الصنايعي غير موجود أو غير منشور" },
      { status: 409 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
