"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { buttonClasses } from "@/components/shared/ui/Button";
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

  return (
    <div className={isIconOnly ? "flex gap-2" : "grid grid-cols-2 gap-2"}>
      <a
        href={telHref(phone)}
        onClick={() => {
          if (craftsmanSlug) track(craftsmanSlug, "call");
        }}
        aria-label="اتصال هاتفي"
        className={buttonClasses("primary", isIconOnly ? "icon" : isLarge ? "lg" : "md")}
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
        className={buttonClasses("action", isIconOnly ? "icon" : isLarge ? "lg" : "md")}
      >
        <IconWhatsApp className={isLarge ? "h-6 w-6" : "h-5 w-5"} />
        {!isIconOnly && "واتساب"}
      </a>
    </div>
  );
}
