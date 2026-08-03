import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getGaConfig, getGaOverview } from "@/lib/analytics/ga";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json(
      { error: "غير مصرح — تحتاج صلاحيات مشرف" },
      { status: 403 },
    );
  }

  if (!getGaConfig().configured) {
    return NextResponse.json(
      {
        error: "لم تُضبط بيانات Google Analytics بعد",
        needsSetup: true,
      },
      { status: 503 },
    );
  }

  try {
    const overview = await getGaOverview();
    return NextResponse.json({ overview });
  } catch (err) {
    console.error("[ga-stats] فشل جلب البيانات:", err);
    return NextResponse.json(
      { error: "مقدرناش نجيب إحصائيات جوجل حالياً" },
      { status: 500 },
    );
  }
}
