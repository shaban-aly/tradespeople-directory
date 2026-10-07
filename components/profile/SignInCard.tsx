import Link from "next/link";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { IconArrow, IconUser } from "@/components/shared/icons";

/**
 * حالة الزائر في صفحة «حسابي»: بطاقة دخول بحساب جوجل.
 * (عرض خالص — بدون "use client").
 */
export function SignInCard() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <IconUser className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
          الملف الشخصي والإعدادات
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted leading-relaxed">
          سجّل دخولك بحساب جوجل لتتمكن من إدارة تقييماتك، حفظ الصنايعية، وضبط
          تفضيلاتك.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center">
          <GoogleSignInButton redirectTo="/profile" />
        </div>

        <div className="mt-6 border-t border-border/50 pt-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent transition-colors hover:underline"
          >
            <IconArrow className="h-3.5 w-3.5" />
            <span>العودة لتصفح دليل الصنايعية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
