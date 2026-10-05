import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/db/cache";

export const runtime = "nodejs";
// force-dynamic: هذا endpoint يستقبل أحداث ولا يُكَش أبداً
export const dynamic = "force-dynamic";

/** قيمة من بيئة الخادم — يجب ضبطها في Vercel Environment Variables */
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET ?? "";

type WebhookEvent = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record?: { slug?: string; id?: string; craftsman_id?: string };
  old_record?: { slug?: string; id?: string; craftsman_id?: string };
  category_slug?: string;
  old_category_slug?: string;
  craftsman_slug?: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 0. التحقق من السر المشترك ──────────────────────────────────────────────
  if (!WEBHOOK_SECRET) {
    console.error("[webhook] SUPABASE_WEBHOOK_SECRET غير مضبوط في البيئة");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const incoming = request.headers.get("x-webhook-secret");
  if (!incoming || incoming !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 1. قراءة الحدث ─────────────────────────────────────────────────────────
  let event: WebhookEvent;
  try {
    event = (await request.json()) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, table, record, old_record } = event;
  const slug = record?.slug ?? old_record?.slug;
  const revalidated: string[] = [];

  // ── 2. إبطال الكاش بناءً على الجدول المتأثر فقط ──────────────────────────
  function invalidate(tag: string) {
    revalidateTag(tag, {});
    revalidated.push(tag);
  }

  switch (table) {
    case "craftsmen":
      // صفحة الصنايعي المحدد (إبطال دقيق بالـ slug)
      if (slug) invalidate(CACHE_TAGS.craftsmanSlug(slug));
      
      // إبطال فئة هذا الصنايعي تحديداً
      const catSlug = event.category_slug;
      if (catSlug) {
        invalidate(CACHE_TAGS.categoryList(catSlug));
      }
      
      // إبطال الفئة القديمة في حالة تغيير تخصص الصنايعي
      const oldCatSlug = event.old_category_slug;
      if (oldCatSlug && oldCatSlug !== catSlug) {
        invalidate(CACHE_TAGS.categoryList(oldCatSlug));
      }

      // تحديث قوائم الرئيسية المُشتقة من بيانات الصنايعي
      invalidate(CACHE_TAGS.allCraftsmen);
      invalidate(CACHE_TAGS.homeVerified);
      invalidate(CACHE_TAGS.homeStats);
      break;

    case "categories":
      invalidate(CACHE_TAGS.categories);
      // قوائم الصنايعية تعتمد على التصنيفات
      invalidate(CACHE_TAGS.allCraftsmen);
      break;

    case "areas":
      invalidate(CACHE_TAGS.areas);
      break;

    case "reviews":
      // إبطال صفحة الصنايعي المُقيَّم
      if (event.craftsman_slug) invalidate(CACHE_TAGS.craftsmanSlug(event.craftsman_slug));
      // التقييمات تؤثر على النجوم وإحصائيات الرئيسية، فيجب تحديث القوائم
      invalidate(CACHE_TAGS.allCraftsmen);
      invalidate(CACHE_TAGS.homeStats);
      break;

    case "craftsman_stats":
    case "craftsman_stats_daily":
      // الإحصائيات تتحدث مع كل زيارة، إبطال الكاش معها سيدمر أداء الموقع بالكامل (Cache Trashing).
      // نكتفي بتحديث القوائم عند إضافة صنايعي جديد أو تقييم جديد.
      return NextResponse.json({ skipped: true, table, type, reason: "prevent-cache-trashing" });

    default:
      // جدول غير مُسجَّل — تجاهل بهدوء
      return NextResponse.json({ skipped: true, table, type });
  }

  return NextResponse.json({
    revalidated: true,
    table,
    type,
    slug: slug ?? null,
    tags: revalidated,
  });
}
