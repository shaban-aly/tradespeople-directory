import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag");
  if (!tag) {
    return NextResponse.json({ error: "وسم revalidate مطلوب" }, { status: 400 });
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
    return NextResponse.json(
      { error: "غير مصرح — سجّل دخول المشرف" },
      { status: 401 },
    );
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

  revalidateTag(tag, { expire: 60 });
  return NextResponse.json({ revalidated: true, tag });
}
