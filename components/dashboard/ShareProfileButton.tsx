"use client";

import { useState } from "react";
import { IconCheck, IconShare } from "@/components/shared/icons";
import { Button } from "@/components/shared/ui/Button";
import { useToast } from "@/hooks/ui/useToast";

export function ShareProfileButton({
  slug,
  name,
  iconOnly = false,
}: {
  slug: string;
  name: string;
  /** نسخة أيقونة مدمجة للهيدر المختصر — بلا نص. */
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/craftsman/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `صفحة الفني ${name} | دليل الصنايعية`,
          text: `تواصل مع ${name} في دليل الصنايعية بالسويس`,
          url,
        });
        return;
      } catch {
        // User dismissed share dialog or unsupported, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("success", "تم نسخ رابط صفحتك بنجاح!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("error", "تعذر نسخ الرابط");
    }
  };

  return (
    <Button
      type="button"
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "md"}
      onClick={() => void handleShare()}
      aria-label={iconOnly ? "مشاركة رابط صفحتك" : undefined}
      className={
        iconOnly
          ? ""
          : "min-h-12 text-base font-bold justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
      }
      title="مشاركة رابط صفحتك مع عملائك"
    >
      {copied ? (
        <>
          <IconCheck className="h-4 w-4 text-emerald-500" />
          {!iconOnly && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              تم النسخ!
            </span>
          )}
        </>
      ) : (
        <>
          <IconShare className="h-4 w-4" />
          {!iconOnly && (
            <>
              <span className="md:hidden">مشاركة</span>
              <span className="hidden md:inline">مشاركة صفحتي</span>
            </>
          )}
        </>
      )}
    </Button>
  );
}
