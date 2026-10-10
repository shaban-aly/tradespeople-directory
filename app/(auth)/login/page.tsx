import Link from "next/link";
import { headers } from "next/headers";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { InAppBrowserNotice } from "@/components/shared/auth/InAppBrowserNotice";
import {
  detectInAppBrowser,
  detectTrafficSource,
} from "@/lib/auth/detectBrowser";
import { siteUrl } from "@/lib/data/site";
import { IconChevronRight, IconShieldCheck } from "@/components/shared/icons";

export const metadata = {
  title: "تسجيل الدخول | دليل الصنايعية",
  description: "سجّل دخولك لحفظ المفضلة، تقديم طلبات الفنيين، وتقييم الصنايعية في السويس.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ reason?: string; next?: string }>;
}

const REASON_MESSAGES: Record<string, { title: string; desc: string }> = {
  favorites: {
    title: "حفظ الصنايعية في المفضلة",
    desc: "سجّل دخولك لحفظ الفنيين المفضلين لديك والرجوع إليهم بسرعة من أي جهاز.",
  },
  craftsman: {
    title: "لوحة تحكم الفني",
    desc: "سجّل دخولك بحساب الفني لإدارة بروفايلك واستقبال طلبات أهالي السويس.",
  },
  join: {
    title: "إضافة صنايعي للدليل",
    desc: "سجّل دخولك أولاً لتقديم طلب انضمام جديد ومتابعة حالة نشره في الدليل.",
  },
  admin: {
    title: "لوحة الإدارة والمشرفين",
    desc: "الوصول لهذه المنطقة مخصص للمشرفين — سجّل دخولك بحساب الإدارة المعتمد.",
  },
  reviews: {
    title: "إدارة تقييماتي ومراجعاتي",
    desc: "سجّل دخولك لعرض التقييمات التي كتبتها للصنايعية في السويس ومشاركتها مع الأهالي.",
  },
  activity: {
    title: "سجل نشاطاتي وتفاعلاتي",
    desc: "سجّل دخولك لمتابعة سجل تفاعلاتك وتقييماتك وطلباتك السابقة في السويس.",
  },
  requests: {
    title: "متابعة طلباتي الحالية",
    desc: "سجّل دخولك لمتابعة طلبات الصيانة واستقبال عروض الصنايعية المباشرة.",
  },
  "request-lead": {
    title: "طلب فني محلي",
    desc: "سجّل دخولك لتأكيد طلبك وتلقي اتصالات وعروض الصنايعية المباشرة.",
  },
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const headerStore = await headers();
  const ua = headerStore.get("user-agent") ?? "";
  const browser = detectInAppBrowser(ua);
  const referrer = headerStore.get("referer");
  const source = detectTrafficSource(params, referrer);

  const query = new URLSearchParams();
  if (params.reason) query.set("reason", params.reason);
  if (params.next) query.set("next", params.next);
  const qs = query.size > 0 ? `?${query.toString()}` : "";
  const url = `${siteUrl}/login${qs}`;

  const reason = params.reason;
  const next = params.next ?? "/";
  const reasonInfo = reason ? REASON_MESSAGES[reason] : null;

  return (
    <div className="w-full">
      {/* بطاقة تسجيل الدخول المركزية */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-card text-center">
        {/* الشعار والهوية */}
        <Link href="/" className="group mx-auto mb-6 flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-2xs transition-transform group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon-96x96.png"
              alt="شعار دليل الصنايعية"
              width={96}
              height={96}
              className="h-10 w-10 object-contain"
            />
          </div>
          <span className="text-xs font-bold text-muted">دليل الصنايعية · السويس</span>
        </Link>

        {/* رأس البطاقة */}
        <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
          أهلاً بيك في دليل السويس!
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          سجّل دخولك للمتابعة والاستفادة من كافة مميزات المنصة.
        </p>

        {/* رسالة سياقية تشرح سبب التحويل إن وجدت */}
        {reasonInfo && (
          <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/5 p-3.5 text-start">
            <div className="flex items-center gap-2 text-accent">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15">
                <IconShieldCheck className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-xs font-bold sm:text-sm">{reasonInfo.title}</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {reasonInfo.desc}
            </p>
          </div>
        )}

        {/* تنبيه المتصفح الداخلي إن وُجد */}
        {browser && (
          <div className="mt-5">
            <InAppBrowserNotice browser={browser} source={source} url={url} ua={ua} />
          </div>
        )}

        {/* زر تسجيل الدخول المباشر */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <GoogleSignInButton redirectTo={next} />
        </div>

        {/* ملاحظة الخصوصية والشروط */}
        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          بتسجيل دخولك، فإنك توافق على{" "}
          <Link href="/privacy" className="font-semibold text-accent underline underline-offset-2 hover:text-accent/80">
            سياسة الخصوصية
          </Link>
          {" "}و{" "}
          <Link href="/terms" className="font-semibold text-accent underline underline-offset-2 hover:text-accent/80">
            شروط الاستخدام
          </Link>
          .
        </p>
      </div>

      {/* رابط العودة للموقع */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-accent"
        >
          <IconChevronRight className="h-4 w-4" />
          <span>العودة للصفحة الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
