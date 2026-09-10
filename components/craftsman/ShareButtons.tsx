"use client";

import { Button, ButtonAnchor } from "@/components/shared/ui/Button";
import { IconCheck, IconLink, IconWhatsApp } from "@/components/shared/icons";
import { useCopyToClipboard } from "@/hooks/ui/useCopyToClipboard";
import { siteUrl } from "@/lib/data/site";
import { craftsmanHref } from "@/lib/utils/url";

export function ShareButtons({ slug, name }: { slug: string; name: string }) {
  const { copied, copy } = useCopyToClipboard();
  const url = `${siteUrl}${craftsmanHref(slug)}`;
  const shareMessage = `${name} — من دليل الصنايعية في السويس\n${url}`;
  const whatsappShare = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonAnchor
        href={whatsappShare}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="شارك على واتساب"
        title="شارك على واتساب"
        variant="ghost"
      >
        <IconWhatsApp className="h-5 w-5" />
        <span className="hidden sm:inline">شارك</span>
      </ButtonAnchor>
      <Button
        type="button"
        onClick={() => copy(url)}
        aria-label={copied ? "تم نسخ الرابط" : "انسخ الرابط"}
        title={copied ? "تم النسخ" : "انسخ الرابط"}
        variant="ghost"
      >
        {copied ? (
          <IconCheck className="h-5 w-5 text-action" />
        ) : (
          <IconLink className="h-5 w-5" />
        )}
        <span className="hidden sm:inline">
          {copied ? "تم النسخ" : "انسخ الرابط"}
        </span>
      </Button>
    </div>
  );
}