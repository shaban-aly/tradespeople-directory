"use client";

import { IconCheck, IconCopy } from "@/components/shared/icons";
import { useCopyToClipboard } from "@/hooks/ui/useCopyToClipboard";

// زر نسخ الرقم إلى الحافظة مع تنبيه تفاعلي «تم النسخ».
// يدعم mode مصغّر (iconOnly) بجانب الأرقام.
export function CopyPhoneButton({
  phone,
  label = "نسخ الرقم",
  iconOnly = false,
}: {
  phone: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const { copied, copy } = useCopyToClipboard();

  async function handleCopy() {
    await copy(phone);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
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
      {!iconOnly && <span>{copied ? "تم النسخ" : label}</span>}
    </button>
  );
}