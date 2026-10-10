"use client";

import { useState } from "react";
import Link from "next/link";
import { IconAlert, IconHome, IconRotateCcw } from "@/components/shared/icons";
import { Button, ButtonLink } from "@/components/shared/ui/Button";

interface DashboardErrorStateProps {
  message?: string;
  hasCustomCraftsmanParam?: boolean;
}

/**
 * حالة الخطأ المرنة عند تعذر جلب بيانات الفني أو فقدان الاتصال:
 * - تتيح زراً تفاعلياً لإعادة المحاولة (Reload).
 * - خيار للعودة للملف الافتراضي في حال كان الرابط يحمل معرّف ملف غير صالح.
 * - زر للعودة للصفحة الرئيسية مع رابط للدعم الفني.
 */
export function DashboardErrorState({
  message = "تعذّر تحميل بيانات الملف المهني المحدد.",
  hasCustomCraftsmanParam = false,
}: DashboardErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    window.location.reload();
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 text-center shadow-card sm:p-10">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
        <IconAlert className="h-8 w-8" />
      </div>

      <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
        تعذّر تحميل بيانات لوحة التحكم
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
        {message}
        <br />
        قد يكون ذلك بسبب بطء مؤقت في الاتصال، أو أن هذا الملف لم يعد متاحاً في حسابك.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          variant="primary"
          className="w-full sm:w-auto min-h-12 text-base justify-center gap-2"
        >
          <IconRotateCcw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          <span>{retrying ? "جارٍ إعادة المحاولة..." : "إعادة المحاولة"}</span>
        </Button>

        {hasCustomCraftsmanParam && (
          <ButtonLink
            href="/dashboard"
            variant="outline"
            className="w-full sm:w-auto min-h-12 text-base justify-center"
          >
            الانتقال للملف الافتراضي
          </ButtonLink>
        )}

        <ButtonLink
          href="/"
          variant="ghost"
          className="w-full sm:w-auto min-h-12 text-base justify-center gap-2"
        >
          <IconHome className="h-4 w-4" />
          <span>العودة للرئيسية</span>
        </ButtonLink>
      </div>

      <div className="mt-6 border-t border-border/50 pt-4 text-xs text-muted">
        إذا استمرت المشكلة، يمكنك{" "}
        <Link href="/contact" className="font-bold text-accent hover:underline">
          مراسلة الدعم الفني
        </Link>
        .
      </div>
    </div>
  );
}
