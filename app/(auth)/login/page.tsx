import Link from "next/link";
import { SocialLoginButton } from "@/components/shared/SocialLoginButton";

export const metadata = {
  title: "تسجيل الدخول | دليل الصنايعية",
  description: "سجّل دخولك لإضافة مفضّلة وتقييم الصنايعية",
};

interface Props {
  searchParams: Promise<{ reason?: string; next?: string }>;
}

const REASON_MESSAGES: Record<string, string> = {
  favorites: "سجّل دخولك عشان تضيف الصنايعي لمفضّلتك",
  craftsman: "المنطقة دي خاصة بحساب الفني",
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const reason = params.reason;
  const next = params.next ?? "/";
  const message = reason ? REASON_MESSAGES[reason] : null;

  return (
    <>
      {/* رأس الصفحة */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent shadow-card">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 fill-none stroke-on-accent stroke-2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-foreground">
          أهلاً بيك!
        </h1>
        <p className="mt-2 text-base text-muted">
          {message ?? "سجّل دخولك للاستمتاع بكل مميزات دليل الصنايعية"}
        </p>
      </div>

      {/* زراير تسجيل الدخول */}
      <div className="flex flex-col gap-3">
        <SocialLoginButton provider="google" redirectTo={next} />
        <SocialLoginButton provider="facebook" redirectTo={next} />
      </div>

      {/* ملاحظة الخصوصية */}
      <p className="mt-6 text-center text-sm text-muted">
        بتسجيل دخولك بتوافق على{" "}
        <Link href="/privacy" className="text-accent underline underline-offset-2">
          سياسة الخصوصية
        </Link>
        {" "}و{" "}
        <Link href="/terms" className="text-accent underline underline-offset-2">
          الشروط والأحكام
        </Link>
      </p>

      {/* رابط العودة */}
      <p className="mt-4 text-center text-base text-muted">
        <Link
          href="/"
          className="font-bold text-accent transition-colors hover:text-accent/80"
        >
          العودة للموقع
        </Link>
      </p>
    </>
  );
}
