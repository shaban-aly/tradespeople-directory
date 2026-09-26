"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { useContactTracker } from "@/hooks/useContactTracker";
import {
  craftsmanWhatsappMessage,
  telHref,
  whatsappHref,
} from "@/lib/utils/url";

export function StickyCallBar({
  phone,
  whatsapp,
  craftsmanId,
  craftsmanSlug,
  craftsmanName,
  categoryName,
  categorySlug,
}: {
  phone: string;
  whatsapp: string;
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

  const hasWhatsapp = Boolean(whatsapp);
  const waUrl = whatsappHref(
    whatsapp,
    craftsmanName
      ? craftsmanWhatsappMessage(craftsmanName, categoryName)
      : undefined,
  );

  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 sm:hidden" data-tour="sticky-call">
      <div className="rounded-2xl border border-border bg-card/95 p-2.5 shadow-up backdrop-blur">
        <div
          className={`grid gap-2 ${hasWhatsapp ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <ButtonAnchor
            href={telHref(phone)}
            data-tour="sticky-call-call"
            onClick={() => handleContact("phone")}
            variant="primary"
            size="md"
          >
            <IconPhone className="h-5 w-5" />
            اتصل
          </ButtonAnchor>
          {hasWhatsapp && (
            <ButtonAnchor
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-tour="sticky-call-whatsapp"
              onClick={() => handleContact("whatsapp")}
              variant="action"
              size="md"
            >
              <IconWhatsApp className="h-5 w-5" />
              واتساب
            </ButtonAnchor>
          )}
        </div>
      </div>
    </div>
  );
}