"use client";

import { IconPhone, IconPlus, IconWhatsApp } from "@/components/shared/icons";
import { ButtonAnchor, ButtonLink } from "@/components/shared/ui/Button";
import { useContactTracker } from "@/hooks/analytics/useContactTracker";
import {
  adminCraftsmanWhatsappMessage,
  craftsmanWhatsappMessage,
  telHref,
  whatsappHref,
} from "@/lib/utils/url";

export function StickyCallBar({
  phone,
  whatsapp,
  routeToAdmin,
  directWhatsappMessage,
  craftsmanId,
  craftsmanSlug,
  craftsmanName,
  categoryName,
  categorySlug,
  area,
}: {
  phone: string;
  whatsapp: string;
  routeToAdmin?: { phone: string; whatsapp: string; customMessage?: string } | null;
  directWhatsappMessage?: string | null;
  craftsmanId?: string;
  craftsmanSlug?: string;
  craftsmanName?: string;
  categoryName?: string;
  categorySlug?: string;
  area?: string;
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
  const phoneLabel = isRouted
    ? craftsmanName
      ? `اتصال بإدارة المنصة بخصوص ${craftsmanName}`
      : "اتصال بإدارة المنصة"
    : craftsmanName
      ? `اتصال هاتفي بـ ${craftsmanName}`
      : "اتصال هاتفي";
  const waLabel = isRouted
    ? craftsmanName
      ? `مراسلة إدارة المنصة بخصوص ${craftsmanName}`
      : "مراسلة إدارة المنصة"
    : craftsmanName
      ? `مراسلة واتساب لـ ${craftsmanName}`
      : "مراسلة واتساب";

  const requestLeadParams = new URLSearchParams();
  if (categorySlug) requestLeadParams.set("category", categorySlug);
  if (area) requestLeadParams.set("area", area);
  const requestLeadHref = `/request/new${requestLeadParams.toString() ? `?${requestLeadParams.toString()}` : ""}`;

  return (
    <aside
      aria-label="خيارات الاتصال السريع"
      className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 sm:hidden px-2 pb-1"
    >
      <div className="rounded-2xl border border-border bg-card/95 p-2 shadow-up backdrop-blur-md">
        <div
          className={`grid gap-1.5 ${hasWhatsapp ? "grid-cols-3" : "grid-cols-2"}`}
        >
          <ButtonAnchor
            href={telHref(effectivePhone)}
            onClick={() => handleContact("phone")}
            aria-label={phoneLabel}
            title={phoneLabel}
            variant="primary"
            size="md"
            className="shadow-xs transition-all active:scale-[0.98] px-2 text-sm font-bold"
          >
            <IconPhone className="h-5 w-5 shrink-0" />
            <span>اتصل</span>
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
              size="md"
              className="shadow-xs transition-all active:scale-[0.98] px-2 text-sm font-bold"
            >
              <IconWhatsApp className="h-5 w-5 shrink-0" />
              <span>واتساب</span>
            </ButtonAnchor>
          )}

          <ButtonLink
            href={requestLeadHref}
            aria-label="اطلب صنايعي في هذا التخصص"
            title="اطلب صنايعي"
            variant="outline"
            size="md"
            className="shadow-xs transition-all active:scale-[0.98] px-2 text-sm font-bold border-accent/40 bg-accent/5 text-accent hover:bg-accent hover:text-white"
          >
            <IconPlus className="h-4 w-4 shrink-0" />
            <span>اطلب فني</span>
          </ButtonLink>
        </div>
      </div>
    </aside>
  );
}