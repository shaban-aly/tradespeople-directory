import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// حماية المسارات — proxy.ts (اسم الملف ثابت في Next.js 16+)
// ⚠️ لا تُغيّر اسم هذا الملف إلى middleware.ts أبداً —
//    Next.js 16 يستخدم proxy.ts حصراً، وأي ملف middleware.ts
//    يُسبب تعارضاً ويكسر التطبيق.
// ============================================================

const LOGIN = "/login";

// المسارات المحمية وأدوارها
const PROTECTED: {
  pattern: RegExp;
  roles: string[];
  fallback: string;
}[] = [
  {
    // لوحة المشرف — تتطلب دور admin، والمدخل موحد عبر صفحة الدخول
    pattern: /^\/admin(\/.*)?$/,
    roles: ["admin"],
    fallback: `${LOGIN}?reason=admin&next=/admin`,
  },
  {
    // لوحة تحكم الفني
    pattern: /^\/dashboard(\/.*)?$/,
    roles: ["craftsman"],
    fallback: `${LOGIN}?reason=craftsman`,
  },
  {
    // المفضّلة — أي مستخدم مسجّل
    pattern: /^\/favorites(\/.*)?$/,
    roles: ["client", "craftsman", "admin"],
    fallback: `${LOGIN}?reason=favorites`,
  },
  {
    // إضافة صنايعي — أي مستخدم مسجّل (الطلب يُربط بحسابه عند الموافقة)
    pattern: /^\/join$/,
    roles: ["client", "craftsman", "admin"],
    fallback: `${LOGIN}?reason=join`,
  },
  {
    // صفحة الإشعارات الكاملة — أي مستخدم مسجّل
    pattern: /^\/notifications(\/.*)?$/,
    roles: ["client", "craftsman", "admin"],
    fallback: `${LOGIN}?reason=notifications`,
  },
  {
    // سجل النشاطات — أي مستخدم مسجّل
    pattern: /^\/activity(\/.*)?$/,
    roles: ["client", "craftsman", "admin"],
    fallback: `${LOGIN}?reason=activity&next=/activity`,
  },
  {
    // تقييماتي ومراجعاتي — أي مستخدم مسجّل
    pattern: /^\/my-reviews(\/.*)?$/,
    roles: ["client", "craftsman", "admin"],
    fallback: `${LOGIN}?reason=reviews&next=/my-reviews`,
  },
  {
    // طلباتي — أي مستخدم مسجّل
    pattern: /^\/my-requests(\/.*)?$/,
    roles: ["client", "craftsman", "admin"],
    fallback: `${LOGIN}?reason=requests&next=/my-requests`,
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

  function buildRedirect(fallback: string): NextResponse {
    const url = request.nextUrl.clone();
    let target = fallback;
    if (pathname.startsWith("/admin") && pathname !== "/admin") {
      target = `${LOGIN}?reason=admin&next=${encodeURIComponent(pathname)}`;
    }
    const [path, query] = target.split("?");
    url.pathname = path;
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url);
  }

  // التحقق من الجلسة
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildRedirect(matched.fallback);
  }

  // تحسين الأداء: إذا كان المسار يقبل جميع الأدوار الثلاثة (client/craftsman/admin)
  // فلا حاجة لاستعلام profiles — المستخدم المسجل مسموح له تلقائياً
  const ALL_ROLES = ["client", "craftsman", "admin"];
  const requiresRoleCheck = !ALL_ROLES.every((r) => matched.roles.includes(r));

  if (!requiresRoleCheck) {
    // المسار عام لكل المستخدمين المسجلين (favorites, join, notifications, activity, my-reviews, my-requests)
    return response;
  }

  // جلب الدور — فقط لمسارات /admin و /dashboard التي تتطلب دوراً محدداً
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "client";

  if (!matched.roles.includes(role)) {
    return buildRedirect(matched.fallback);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/favorites/:path*",
    "/join",
    "/notifications/:path*",
    "/activity/:path*",
    "/my-reviews/:path*",
    "/my-requests/:path*",
  ],
};

