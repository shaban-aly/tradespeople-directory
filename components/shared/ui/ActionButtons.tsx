"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { useStats } from "@/hooks/useStats";
import {
  craftsmanWhatsappMessage,
  telHref,
  whatsappHref,
} from "@/lib/utils/url";

export function ActionButtons({
  phone,
  whatsapp,
  size = "md",
  craftsmanSlug,
  craftsmanName,
}: {
  phone: string;
  whatsapp: string;
  size?: "sm" | "md" | "lg";
  craftsmanSlug?: string;
  craftsmanName?: string;
}) {
  const { track } = useStats();
  const waUrl = whatsappHref(
    whatsapp,
    craftsmanName ? craftsmanWhatsappMessage(craftsmanName) : undefined,
  );
  const isLarge = size === "lg";
  const isIconOnly = size === "sm";
  const buttonClass = isLarge
    ? "min-h-14 gap-3 px-4 text-lg"
    : isIconOnly
      ? "h-12 w-12"
      : "min-h-12 px-3 text-base";

  return (
    <div className={isIconOnly ? "flex gap-2" : "grid grid-cols-2 gap-2"}>
      <a
        href={telHref(phone)}
        onClick={() => {
          if (craftsmanSlug) track(craftsmanSlug, "call");
        }}
        aria-label="اتصال هاتفي"
        className={`flex items-center justify-center gap-2 rounded-xl bg-accent font-bold text-on-accent transition-colors hover:bg-accent/90 ${buttonClass}`}
      >
        <IconPhone className={isLarge ? "h-6 w-6" : "h-5 w-5"} />
        {!isIconOnly && "اتصل"}
      </a>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (craftsmanSlug) track(craftsmanSlug, "whatsapp");
        }}
        aria-label="مراسلة واتساب"
        className={`flex items-center justify-center gap-2 rounded-xl bg-action font-bold text-on-action transition-colors hover:bg-action/90 ${buttonClass}`}
      >
        <IconWhatsApp className={isLarge ? "h-6 w-6" : "h-5 w-5"} />
        {!isIconOnly && "واتساب"}
      </a>
    </div>
  );
}
