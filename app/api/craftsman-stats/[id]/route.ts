import { NextRequest, NextResponse } from "next/server";
import { createServerReadClient } from "@/lib/db/client";

export const runtime = "nodejs";
/**
 * revalidate = 300: Vercel يحتفظ بالنتيجة 5 دقائق ويوزعها على الزوار
 * بدلاً من ضرب Supabase في كل طلب. العدادات تُعرض بتأخير أقصاه 5 دقائق.
 *
 * لماذا 300 وليس false؟
 * لأن العدادات لا ترتبط بـ webhook (تتغير بكثرة ولا نريد ISR Write في كل زيارة)،
 * لذا نقبل تأخيراً بسيطاً مع حماية Supabase من الضغط المباشر.
 */
export const revalidate = 300;

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

  // إذا لم يكن للصنايعي سجل بعد → أعِد أصفاراً
  return NextResponse.json(
    data ?? { views: 0, calls: 0, whatsapp: 0, updated_at: null },
  );
}
