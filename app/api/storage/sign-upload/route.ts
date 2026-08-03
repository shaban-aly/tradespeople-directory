import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerReadClient } from "@/lib/db/client";
import { IMAGE_BUCKET, MAX_IMAGE_SIZE_MB } from "@/lib/storage/images";
import { getClientIpFromRequest, rateLimitConsume } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_FOLDERS = ["requests", "craftsmen"] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const REQUESTS_RATE = 30;
const CRAFTSMEN_RATE = 60;
const WINDOW_MS = 60_000;

function sanitizeBaseName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").toLowerCase();
  const cleaned = base.replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 60);
  return cleaned || "image";
}

function isValidRequest(body: unknown): body is { folder: string; fileName: string } {
  if (!body || typeof body !== "object") return false;
  const candidate = body as { folder?: unknown; fileName?: unknown };
  return typeof candidate.folder === "string" && typeof candidate.fileName === "string";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });
  }

  if (!isValidRequest(body)) {
    return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });
  }

  const folder = body.folder as UploadFolder;
  if (!ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: "المجلد غير مسموح" }, { status: 400 });
  }

  const ext = body.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 });
  }

  const ip = getClientIpFromRequest(request);
  const rateLimitKey = `sign:${ip}:${folder}`;
  const { allowed, remaining, retryAfter } = await rateLimitConsume(rateLimitKey, {
    limit: folder === "craftsmen" ? CRAFTSMEN_RATE : REQUESTS_RATE,
    windowMs: WINDOW_MS,
  });

  const headers = {
    "x-ratelimit-limit": String(folder === "craftsmen" ? CRAFTSMEN_RATE : REQUESTS_RATE),
    "x-ratelimit-remaining": String(remaining),
    ...(retryAfter > 0 ? { "x-ratelimit-retry-after": String(retryAfter) } : {}),
  };

  if (!allowed) {
    return NextResponse.json(
      { error: "طلبات كتير في وقت قصير — حاول بعد شوية" },
      { status: 429, headers },
    );
  }

  const base = sanitizeBaseName(body.fileName);
  const uuid = crypto.randomUUID();
  const path =
    folder === "requests"
      ? `requests/${uuid}-${base}.${ext}`
      : `craftsmen/${uuid}/${crypto.randomUUID()}-${base}.${ext}`;

  let supabase;
  if (folder === "craftsmen") {
    const cookieStore = await cookies();
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // للقراءة فقط — لا نكتب كوكيز من هذا المسار
          },
        },
      },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
  } else {
    supabase = createServerReadClient();
  }

  try {
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json({ error: "مقدرناش نحضّر الرفع" }, { status: 500, headers });
    }

    return NextResponse.json(
      { token: data.token, path, maxSizeBytes: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
      { headers },
    );
  } catch {
    return NextResponse.json({ error: "مقدرناش نحضّر الرفع" }, { status: 500, headers });
  }
}
