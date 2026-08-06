import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type AnalyticsOverview = {
  todayUsers: number;
  weekUsers: number;
  todayPageviews: number;
  weekPageviews: number;
  viewSessions: number;
  contactSessions: number;
  conversionRate: number;
};

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

  const { data: overview, error: rpcError } = await supabase.rpc(
    "get_analytics_overview",
  );
  if (rpcError) {
    console.error("[analytics] فشل جلب البيانات:", rpcError);
    return NextResponse.json({ error: "فشل جلب البيانات" }, { status: 500 });
  }

  return NextResponse.json({ overview: overview as AnalyticsOverview });
}
