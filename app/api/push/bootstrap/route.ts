import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/push/bootstrap — مشرف فقط
 * يعيد مزامنة إعدادات توزيع FCM (push_settings) من متغيرات بيئة السيرفر
 * إلى القاعدة (كما يقرؤها trigger التوزيع في 0016). لا يُكتب أي سر من
 * الريبو/العميل — المصدر هو env فقط، والقراءة من قاعدة الوصول نفسه.
 *
 * متغيرات البيئة المقروءة:
 *   PUSH_FUNCTION_URL          (رابط Edge Function send-push)
 *   PUSH_FUNCTION_SECRET       (سر مشترك بين trigger والدالة)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (apikey الذي يمرره pg_net للـ gateway)
 *
 * إعادة جدولة إعادة المحاولة (pg_cron) لا تُستدعى من هنا عمداً:
 * كل كتابة في push_settings يُطلق trigger (20261004103200) يستدعي
 * refresh_notification_push_cron، في.reflect成為 الإعدادات الحالية تلقائياً
 * هنا وفي أي كاتب مستقبلي. هذا المسار وحده يكفي — لو صار cron مرتبطاً
 * بمسار واحد لبقي سلوك الجدولة معطّلاً حين يُعدَّل المفتاح من غيره.
 * فحص المشرف على upsert_push_setting يتمّ داخل الدالة (profiles.role)،
 * لأن دور authenticated يحتاج EXECUTE لاستدعائها من جلسة المستخدم.
 */
export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "POST فقط" }, { status: 405 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "غير مصرح — سجّل دخول المشرف" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح — تحتاج صلاحيات مشرف" }, { status: 403 });
  }

  const candidateKeys = [
    { dbKey: "push_apikey", envValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
    { dbKey: "push_function_url", envValue: process.env.PUSH_FUNCTION_URL ?? "" },
    { dbKey: "push_secret", envValue: process.env.PUSH_FUNCTION_SECRET ?? "" },
  ];

  const synced: string[] = [];
  const skipped: string[] = [];
  for (const { dbKey, envValue } of candidateKeys) {
    const value = envValue.trim();
    if (!value) {
      skipped.push(dbKey);
      continue;
    }
    const { error: rpcError } = await supabase.rpc("upsert_push_setting", {
      p_key: dbKey,
      p_value: value,
    });
    if (rpcError) {
      return NextResponse.json(
        { error: `فشل مزامنة ${dbKey}: ${rpcError.message}` },
        { status: 500 },
      );
    }
    synced.push(dbKey);
  }

  return NextResponse.json({ synced, skipped });
}