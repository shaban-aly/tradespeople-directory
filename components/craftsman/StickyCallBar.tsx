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
  const { track: counterTrack } = useStats();
  const hasWhatsapp = Boolean(whatsapp);
  const waUrl = whatsappHref(
    whatsapp,
    craftsmanName
      ? craftsmanWhatsappMessage(craftsmanName, categoryName)
      : undefined,
  );

  return (
    <div className="sticky bottom-18 z-20 sm:hidden" data-tour="sticky-call">
      <div className="rounded-2xl border border-border bg-card/95 p-2.5 shadow-up backdrop-blur">
        <div
          className={`grid gap-2 ${hasWhatsapp ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <ButtonAnchor
            href={telHref(phone)}
            data-tour="sticky-call-call"
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