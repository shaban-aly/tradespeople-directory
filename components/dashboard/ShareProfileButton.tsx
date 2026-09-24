"use client";

import { useState } from "react";
import { IconCheck, IconShare } from "@/components/shared/icons";
import { Button } from "@/components/shared/ui/Button";
import { useToast } from "@/hooks/ui/useToast";

export function ShareProfileButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
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
      variant="outline"
      onClick={() => void handleShare()}
      className="min-h-11 sm:min-h-12 text-xs sm:text-sm font-semibold justify-center gap-2 w-full sm:w-auto"
      title="مشاركة رابط صفحتك مع عملائك"
    >
      {copied ? (
        <>
          <IconCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            تم النسخ!
          </span>
        </>
      ) : (
        <>
          <IconShare className="h-4 w-4" />
          <span>مشاركة صفحتي</span>
        </>
      )}
    </Button>
  );
}
