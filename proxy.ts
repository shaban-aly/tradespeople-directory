import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// حماية المسارات — proxy.ts (اسم الملف ثابت في Next.js 16+)
// ⚠️ لا تُغيّر اسم هذا الملف إلى middleware.ts أبداً —
//    Next.js 16 يستخدم proxy.ts حصراً، وأي ملف middleware.ts
//    يُسبب تعارضاً ويكسر التطبيق.
// ============================================================

const ADMIN_LOGIN = "/admin/login";
const CLIENT_LOGIN = "/login";

// المسارات المحمية وأدوارها
const PROTECTED: {
  pattern: RegExp;
  roles: string[];
  fallback: string;
}[] = [
  {
    // لوحة المشرف (ما عدا صفحة الدخول)
    pattern: /^\/admin(?:\/(?!login).*)?$|^\/admin$/,
    roles: ["admin"],
    fallback: ADMIN_LOGIN,
  },
  {
    // لوحة تحكم الفني
    pattern: /^\/dashboard(\/.*)?$/,
    roles: ["craftsman"],
    fallback: `${CLIENT_LOGIN}?reason=craftsman`,
  },
  {
    // المفضّلة — أي مستخدم مسجّل
    pattern: /^\/favorites(\/.*)?$/,
    roles: ["client", "craftsman", "admin"],
    fallback: `${CLIENT_LOGIN}?reason=favorites`,
  },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matched = PROTECTED.find((r) => r.pattern.test(pathname));
  if (!matched) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // التحقق من الجلسة
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    const [path, query] = matched.fallback.split("?");
    url.pathname = path;
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url);
  }

  // جلب الدور
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "client";

  if (!matched.roles.includes(role)) {
    const url = request.nextUrl.clone();
    const [path, query] = matched.fallback.split("?");
    url.pathname = path;
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/favorites/:path*"],
};

