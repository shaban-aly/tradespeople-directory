/**
 * GET /api/admin/ga4-summary
 * يجلب ملخص GA4 (sessions, active users, page views) للمشرف فقط.
 * يُستدعى من لوحة التحكم على السيرفر — credentials لا تصل للعميل.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/db/server";
import { fetchGA4SiteSummary } from "@/lib/analytics/ga4-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, supabase } = await getServerSession();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // فحص الدور من profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const summary = await fetchGA4SiteSummary();
  return NextResponse.json(summary);
}
