"use client";

import { useRef, useState } from "react";
import { IconCheck, IconCopy } from "@/components/shared/icons";

// زر نسخ الرقم إلى الحافظة مع تنبيه تفاعلي «تم النسخ».
// يدعم mode مصغّر (iconOnly) بجانب الأرقام، وfallback قديم للنسخ.
export function CopyPhoneButton({
  phone,
  label = "نسخ الرقم",
  iconOnly = false,
}: {
  phone: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(phone);
        ok = true;
      }
    } catch {
      ok = false;
    }

    if (!ok) {
      // Fallback للمتصفحات الأقدم / السياقات غير الآمنة
      const textarea = document.createElement("textarea");
      textarea.value = phone;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        ok = true;
      } catch {
        ok = false;
      }
      document.body.removeChild(textarea);
    }

    if (!ok) return;

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      title={copied ? "تم النسخ" : label}
      aria-label={copied ? "تم النسخ" : label}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border-2 font-bold transition-all active:scale-[0.98] ${
        iconOnly ? "min-h-12 w-12 p-0" : "min-h-12 px-3 text-base"
      } ${
        copied
          ? "border-action bg-action text-on-action"
          : "border-accent text-accent hover:bg-accent hover:text-on-accent"
      }`}
    >
      {copied ? (
        <IconCheck className="h-5 w-5" />
      ) : (
        <IconCopy className="h-5 w-5" />
      )}
      {!iconOnly && (
        <span className={copied ? "" : ""}>{copied ? "تم النسخ" : label}</span>
      )}
    </button>
  );
}
