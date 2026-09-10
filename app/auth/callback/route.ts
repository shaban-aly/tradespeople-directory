import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /auth/callback?code=...&next=/
// Supabase بيعيد التوجيه لهنا بعد OAuth — نبادل الكود بجلسة ونحوّل للصفحة المطلوبة
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // تحقق من الصفحة المطلوبة (لمنع Open Redirect)
      const redirectTo = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // في حالة الخطأ نرجع لصفحة الدخول مع رسالة
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
