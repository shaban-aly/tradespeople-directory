"use client";

import { Button, ButtonAnchor } from "@/components/shared/ui/Button";
import { IconCheck, IconLink, IconWhatsApp } from "@/components/shared/icons";
import { useCopyToClipboard } from "@/hooks/ui/useCopyToClipboard";
import { siteUrl } from "@/lib/data/site";
import { craftsmanHref } from "@/lib/utils/url";

export function ShareButtons({
  slug,
  name,
  size = "md",
}: {
  slug: string;
  name: string;
  size?: "sm" | "md";
}) {
  const { copied, copy } = useCopyToClipboard();
  const url = `${siteUrl}${craftsmanHref(slug)}`;
  const shareMessage = `${name} — من دليل الصنايعية في السويس\n${url}`;
  const whatsappShare = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  const isSmall = size === "sm";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonAnchor
        href={whatsappShare}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="شارك على واتساب"
        title="شارك على واتساب"
        variant="ghost"
        size={size}
        className={isSmall ? "min-h-10 h-10 px-3 text-xs" : undefined}
      >
        <IconWhatsApp className={isSmall ? "h-4 w-4" : "h-5 w-5"} />
        <span>مشاركة</span>
      </ButtonAnchor>
      <Button
        type="button"
        onClick={() => copy(url)}
        aria-label={copied ? "تم نسخ الرابط" : "انسخ الرابط"}
        title={copied ? "تم النسخ" : "انسخ الرابط"}
        variant="ghost"
        size={size}
        className={isSmall ? "min-h-10 h-10 px-3 text-xs" : undefined}
      >
        {copied ? (
          <IconCheck className={`${isSmall ? "h-4 w-4" : "h-5 w-5"} text-action`} />
        ) : (
          <IconLink className={isSmall ? "h-4 w-4" : "h-5 w-5"} />
        )}
        <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
      </Button>
    </div>
  );
}