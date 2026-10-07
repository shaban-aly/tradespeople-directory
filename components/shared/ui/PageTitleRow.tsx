"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/**
 * سطر العنوان الموحد لكل الصفحات: [رجوع] [عنوان + وصف] … [إجراء واحد].
 * زر الرجوع يحترم من أين أتيت (تاريخ المتصفح) مع مسار احتياطي يمنع
 * الخروج من التطبيق عند الفتح المباشر.
 */
export function PageTitleRow({
  title,
  description,
  backFallback = "/",
  backLabel = "رجوع",
  action,
}: {
  title: string;
  description?: string;
  backFallback?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(backFallback);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleBack}
        aria-label={backLabel}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card border border-border/50 text-muted hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold font-heading sm:text-2xl">{title}</h1>
        {description && <p className="text-muted text-sm mt-0.5 truncate">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
