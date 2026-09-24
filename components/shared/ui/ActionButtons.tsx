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
  craftsmanId,
  craftsmanSlug,
  craftsmanName,
  categoryName,
  categorySlug,
  tourPrefix,
}: {
  phone: string;
  whatsapp: string;
  size?: "sm" | "md" | "lg";
  craftsmanId?: string;
  craftsmanSlug?: string;
  craftsmanName?: string;
  categoryName?: string;
  categorySlug?: string;
  /** بادئة وسوم الجولة على الأزرار نفسها (مثال: "card" → card-call/card-whatsapp) */
  tourPrefix?: string;
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
        data-tour={tourPrefix ? `${tourPrefix}-call` : undefined}
        onClick={() => {
          if (craftsmanSlug) {
            counterTrack(craftsmanSlug, "call", categorySlug);
            track("click_phone", { craftsman_slug: craftsmanSlug, category: categoryName });
            track("contact_click", {
              craftsman_id: craftsmanId,
              craftsman_slug: craftsmanSlug,
              craftsman_name: craftsmanName,
              contact_method: "phone",
            });
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
        data-tour={tourPrefix ? `${tourPrefix}-whatsapp` : undefined}
        onClick={() => {
          if (craftsmanSlug) {
            counterTrack(craftsmanSlug, "whatsapp", categorySlug);
            track("click_whatsapp", { craftsman_slug: craftsmanSlug, category: categoryName });
            track("contact_click", {
              craftsman_id: craftsmanId,
              craftsman_slug: craftsmanSlug,
              craftsman_name: craftsmanName,
              contact_method: "whatsapp",
            });
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