"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { useStats } from "@/hooks/admin/useStats";
import { telHref, whatsappHref } from "@/lib/utils/url";

export function ActionButtons({
  phone,
  whatsapp,
  size = "md",
  craftsmanSlug,
}: {
  phone: string;
  whatsapp: string;
  size?: "md" | "lg";
  craftsmanSlug?: string;
}) {
  const { track } = useStats();
  const waUrl = whatsappHref(whatsapp);
  const isLarge = size === "lg";

  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={telHref(phone)}
        onClick={() => {
          if (craftsmanSlug) track(craftsmanSlug, "call");
        }}
        className={`flex items-center justify-center gap-2 rounded-xl bg-accent font-bold text-on-accent transition-colors hover:bg-accent/90 ${
          isLarge ? "min-h-14 gap-3 px-4 text-lg" : "min-h-12 px-3 text-base"
        }`}
      >
        <IconPhone className={isLarge ? "h-6 w-6" : "h-5 w-5"} />
        اتصل
      </a>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (craftsmanSlug) track(craftsmanSlug, "whatsapp");
        }}
        className={`flex items-center justify-center gap-2 rounded-xl bg-action font-bold text-on-action transition-colors hover:bg-action/90 ${
          isLarge ? "min-h-14 gap-3 px-4 text-lg" : "min-h-12 px-3 text-base"
        }`}
      >
        <IconWhatsApp className={isLarge ? "h-6 w-6" : "h-5 w-5"} />
        واتساب
      </a>
    </div>
  );
}
