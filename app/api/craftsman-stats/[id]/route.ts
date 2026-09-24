import { NextRequest, NextResponse } from "next/server";
import { createServerReadClient } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ID_LENGTH = 36; // UUID v4

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  // تحقق بسيط من شكل UUID لمنع المدخلات غير الصحيحة
  if (
    !id ||
    id.length > MAX_ID_LENGTH ||
    !/^[0-9a-f-]+$/i.test(id)
  ) {
    return NextResponse.json({ error: "معرّف غير صحيح" }, { status: 400 });
  }

  const supabase = createServerReadClient();
  const { data, error } = await supabase
    .from("craftsman_stats")
    .select("views, calls, whatsapp, updated_at")
    .eq("craftsman_id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "فشل جلب الإحصائيات" }, { status: 500 });
  }

  // Cache-Control: Vercel CDN يكَّش الرد 5 دقائق، المتصفح لا يكَّش (no-store)
  const response = NextResponse.json(
    data ?? { views: 0, calls: 0, whatsapp: 0, updated_at: null },
  );
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );
  return response;
}
