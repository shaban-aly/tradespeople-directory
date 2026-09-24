import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServerReadClient } from "@/lib/db/client";
import { consumeRateLimit } from "@/lib/db/rate-limit";
import { getClientIpFromRequest } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 60;
const WINDOW_MS = 60_000;
const MAX_SLUG_LENGTH = 90;
const SLUG_PATTERN = /^[a-z0-9\u0621-\u064A\u0660-\u0669]+(?:-[a-z0-9\u0621-\u064A\u0660-\u0669]+)*$/;

type Metric = "view" | "call" | "whatsapp";
type ContactMethod = "phone" | "whatsapp";
type ErrorResponse = { error: string };

const METRICS: Metric[] = ["view", "call", "whatsapp"];

export async function POST(request: NextRequest) {
  let body: {
    slug?: unknown;
    type?: unknown;
    contact_method?: unknown;
  };
  try {
    body = (await request.json()) as {
      slug?: unknown;
      type?: unknown;
      contact_method?: unknown;
    };
  } catch {
    return NextResponse.json<ErrorResponse>({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  
  // قبول type أو contact_method
  let type: Metric | undefined;
  if (typeof body.contact_method === "string") {
    const cm = body.contact_method.toLowerCase();
    if (cm === "phone") type = "call";
    else if (cm === "whatsapp") type = "whatsapp";
  } else if (typeof body.type === "string" && METRICS.includes(body.type as Metric)) {
    type = body.type as Metric;
  }

  if (!slug || slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json<ErrorResponse>({ error: "slug غير صحيح" }, { status: 400 });
  }
  if (!type) {
    return NextResponse.json<ErrorResponse>({ error: "نوع الحدث غير صحيح" }, { status: 400 });
  }

  // التحقق من كوكي المشاهدات (حماية إضافية على السيرفر لضمان فرادة المشاهدة خلال 24 ساعة)
  const viewedCookie = request.cookies.get("sanay_views")?.value ?? "";
  const viewedList = viewedCookie ? viewedCookie.split(",") : [];

  if (type === "view" && viewedList.includes(slug)) {
    // تم تسجيل مشاهدة هذا الصانع بالفعل من هذا المتصفح خلال الـ 24 ساعة
    return new NextResponse(null, { status: 204 });
  }

  const ip = getClientIpFromRequest(request);
  const supabase = createServerReadClient();
  const { allowed } = await consumeRateLimit(supabase, `stats:${ip}:${slug}`, {
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!allowed) {
    return NextResponse.json<ErrorResponse>(
      { error: "طلبات كتير في وقت قصير — حاول بعد شوية" },
      { status: 429 },
    );
  }

  // فحص الجلسة لمعرفة حالة المستخدم
  let userId: string | null = null;
  let userStatus: "authenticated" | "anonymous" = "anonymous";
  try {
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      },
    );
    const { data: userData } = await supabaseAuth.auth.getUser();
    if (userData?.user) {
      userId = userData.user.id;
      userStatus = "authenticated";
    }
  } catch {
    // في حال تعذر قراءة الجلسة، يُعامل كـ anonymous
  }

  const { data, error } = await supabase.rpc("increment_craftsman_stats", {
    p_slug: slug,
    p_action: type,
    p_ip: ip,
    p_user_id: userId ?? undefined,
    p_user_status: userStatus,
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

  const response = new NextResponse(null, { status: 204 });
  if (type === "view") {
    const updated = [...viewedList.filter((s) => s !== slug), slug].slice(-30);
    response.cookies.set("sanay_views", updated.join(","), {
      maxAge: 86400, // 24 ساعة
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}