"use client";

import { IconCheck, IconCopy } from "@/components/shared/icons";
import { useCopyToClipboard } from "@/hooks/ui/useCopyToClipboard";

// زر نسخ الرقم إلى الحافظة مع تنبيه تفاعلي «تم النسخ».
// يدعم mode مصغّر (iconOnly) بجانب الأرقام.
export function CopyPhoneButton({
  phone,
  label = "نسخ الرقم",
  iconOnly = false,
  size = "md",
}: {
  phone: string;
  label?: string;
  iconOnly?: boolean;
  size?: "sm" | "md";
}) {
  const { copied, copy } = useCopyToClipboard();

  async function handleCopy() {
    await copy(phone);
  }

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      title={copied ? "تم النسخ" : label}
      aria-label={copied ? "تم النسخ بنجاح" : label}
      className={`inline-flex items-center justify-center gap-1.5 font-bold transition-all active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-accent ${
        iconOnly
          ? isSmall
            ? "h-9 w-9 rounded-lg border"
            : "min-h-12 w-12 rounded-xl border-2 p-0"
          : isSmall
            ? "h-9 px-2.5 text-xs rounded-lg border"
            : "min-h-12 px-3 text-base rounded-xl border-2"
      } ${
        copied
          ? "border-action bg-action text-on-action shadow-xs"
          : "border-accent/40 text-accent hover:border-accent hover:bg-accent/10"
      }`}
    >
      {copied ? (
        <IconCheck className={isSmall ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <IconCopy className={isSmall ? "h-4 w-4" : "h-5 w-5"} />
      )}
      {!iconOnly && <span>{copied ? "تم النسخ" : label}</span>}
    </button>
  );
}