"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { useStats } from "@/hooks/useStats";
import { track } from "@/lib/analytics/track";
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
  categoryName,
  categorySlug,
}: {
  phone: string;
  whatsapp: string;
  size?: "sm" | "md" | "lg";
  craftsmanSlug?: string;
  craftsmanName?: string;
  categoryName?: string;
  categorySlug?: string;
}) {
  const { track: counterTrack } = useStats();
  const waUrl = whatsappHref(
    whatsapp,
    craftsmanName
      ? craftsmanWhatsappMessage(craftsmanName, categoryName)
      : undefined,
  );
  const isLarge = size === "lg";
  const isIconOnly = size === "sm";

  const buttonSize = isIconOnly ? "icon" : isLarge ? "lg" : "md";

  return (
    <div className={isIconOnly ? "flex gap-2" : "grid grid-cols-2 gap-2"}>
      <ButtonAnchor
        href={telHref(phone)}
        onClick={() => {
          if (craftsmanSlug) {
            counterTrack(craftsmanSlug, "call", categorySlug);
            track("click_phone", { craftsman_slug: craftsmanSlug, category: categoryName });
          }
        }}
        aria-label="اتصال هاتفي"
        variant="primary"
        size={buttonSize}
      >
        <IconPhone className={isLarge ? "h-6 w-6" : "h-5 w-5"} />
        {!isIconOnly && "اتصل"}
      </ButtonAnchor>
      <ButtonAnchor
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (craftsmanSlug) {
            counterTrack(craftsmanSlug, "whatsapp", categorySlug);
            track("click_whatsapp", { craftsman_slug: craftsmanSlug, category: categoryName });
          }
        }}
        aria-label="مراسلة واتساب"
        variant="action"
        size={buttonSize}
      >
        <IconWhatsApp className={isLarge ? "h-6 w-6" : "h-5 w-5"} />
        {!isIconOnly && "واتساب"}
      </ButtonAnchor>
    </div>
  );
}