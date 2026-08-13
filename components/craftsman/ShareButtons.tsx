"use client";

import { useState } from "react";
import {
  IconCheck,
  IconLink,
  IconWhatsApp,
} from "@/components/shared/icons";
import { siteUrl } from "@/lib/data/site";
import { craftsmanHref } from "@/lib/utils/url";

export function ShareButtons({ slug, name }: { slug: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${siteUrl}${craftsmanHref(slug)}`;
  const shareMessage = `${name} — من دليل الصنايعية في السويس\n${url}`;
  const whatsappShare = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={whatsappShare}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="شارك على واتساب"
        title="شارك على واتساب"
        className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-base font-bold text-muted transition-colors hover:border-action hover:text-action"
      >
        <IconWhatsApp className="h-5 w-5" />
        <span className="hidden sm:inline">شارك</span>
      </a>
      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? "تم نسخ الرابط" : "انسخ الرابط"}
        title={copied ? "تم النسخ" : "انسخ الرابط"}
        className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-base font-bold text-muted transition-colors hover:border-accent hover:text-accent"
      >
        {copied ? (
          <IconCheck className="h-5 w-5 text-action" />
        ) : (
          <IconLink className="h-5 w-5" />
        )}
        <span className="hidden sm:inline">{copied ? "تم النسخ" : "انسخ الرابط"}</span>
      </button>
    </div>
  );
}
