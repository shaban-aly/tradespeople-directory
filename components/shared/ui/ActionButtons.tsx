"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { useContactTracker } from "@/hooks/analytics/useContactTracker";
import {
  adminCraftsmanWhatsappMessage,
  craftsmanWhatsappMessage,
  telHref,
  whatsappHref,
} from "@/lib/utils/url";

export function ActionButtons({
  phone,
  whatsapp,
  routeToAdmin,
  directWhatsappMessage,
  size = "md",
  craftsmanId,
  craftsmanSlug,
  craftsmanName,
  categoryName,
  categorySlug,
}: {
  phone: string;
  whatsapp: string;
  routeToAdmin?: { phone: string; whatsapp: string; customMessage?: string } | null;
  directWhatsappMessage?: string | null;
  size?: "sm" | "md" | "lg";
  craftsmanId?: string;
  craftsmanSlug?: string;
  craftsmanName?: string;
  categoryName?: string;
  categorySlug?: string;
}) {
  const { handleContact } = useContactTracker({
    craftsmanId,
    craftsmanSlug,
    craftsmanName,
    categoryName,
    categorySlug,
  });

  const isRouted = Boolean(routeToAdmin);
  const effectivePhone = routeToAdmin?.phone || phone;
  const effectiveWhatsapp = routeToAdmin?.whatsapp || whatsapp;

  const hasWhatsapp = Boolean(effectiveWhatsapp && effectiveWhatsapp.trim().length > 0);
  const waMessage = isRouted
    ? routeToAdmin?.customMessage ||
      (craftsmanName ? adminCraftsmanWhatsappMessage(craftsmanName, categoryName) : undefined)
    : directWhatsappMessage ||
      (craftsmanName ? craftsmanWhatsappMessage(craftsmanName, categoryName) : undefined);

  const waUrl = hasWhatsapp ? whatsappHref(effectiveWhatsapp, waMessage) : "";
  const isLarge = size === "lg";
  const isSmall = size === "sm";

  const buttonSize = isLarge ? "lg" : isSmall ? "sm" : "md";
  const phoneLabel = isRouted
    ? craftsmanName
      ? `اتصال بإدارة المنصة (${effectivePhone}) بخصوص ${craftsmanName}`
      : `اتصال بإدارة المنصة (${effectivePhone})`
    : craftsmanName
      ? `اتصال هاتفي بـ ${craftsmanName} (${effectivePhone})`
      : `اتصال هاتفي (${effectivePhone})`;
  const waLabel = isRouted
    ? craftsmanName
      ? `مراسلة إدارة المنصة (${effectiveWhatsapp}) بخصوص ${craftsmanName}`
      : `مراسلة إدارة المنصة (${effectiveWhatsapp})`
    : craftsmanName
      ? `مراسلة واتساب لـ ${craftsmanName}`
      : "مراسلة واتساب";

  return (
    <div
      className={
        hasWhatsapp
          ? "grid grid-cols-2 gap-2"
          : "grid grid-cols-1 gap-2"
      }
    >
      <ButtonAnchor
        href={telHref(effectivePhone)}
        onClick={() => handleContact("phone")}
        aria-label={phoneLabel}
        title={phoneLabel}
        variant="primary"
        size={buttonSize}
        className="w-full shadow-xs hover:shadow-accent/20 transition-all active:scale-[0.98]"
      >
        <IconPhone className={isLarge ? "h-6 w-6" : isSmall ? "h-4.5 w-4.5 shrink-0" : "h-5 w-5 shrink-0"} />
        <span className={isSmall ? "truncate text-xs sm:text-sm font-bold" : "truncate"}>
          {hasWhatsapp ? "اتصل" : "اتصال هاتفي"}
        </span>
      </ButtonAnchor>
      {hasWhatsapp && (
        <ButtonAnchor
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleContact("whatsapp")}
          aria-label={waLabel}
          title={waLabel}
          variant="action"
          size={buttonSize}
          className="w-full shadow-xs hover:shadow-action/20 transition-all active:scale-[0.98]"
        >
          <IconWhatsApp className={isLarge ? "h-6 w-6" : isSmall ? "h-4.5 w-4.5 shrink-0" : "h-5 w-5 shrink-0"} />
          <span className={isSmall ? "truncate text-xs sm:text-sm font-bold" : "truncate"}>
            واتساب
          </span>
        </ButtonAnchor>
      )}
    </div>
  );
}