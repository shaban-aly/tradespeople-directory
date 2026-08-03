"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { useStats } from "@/hooks/admin/useStats";
import {
  craftsmanWhatsappMessage,
  telHref,
  whatsappHref,
} from "@/lib/utils/url";

export function StickyCallBar({
  phone,
  whatsapp,
  craftsmanSlug,
  craftsmanName,
}: {
  phone: string;
  whatsapp: string;
  craftsmanSlug?: string;
  craftsmanName?: string;
}) {
  const { track } = useStats();
  const hasWhatsapp = Boolean(whatsapp);
  const waUrl = whatsappHref(
    whatsapp,
    craftsmanName ? craftsmanWhatsappMessage(craftsmanName) : undefined,
  );

  return (
    <div className="sticky bottom-3 z-20 sm:hidden">
      <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-up backdrop-blur">
        <div
          className={`grid gap-2 ${hasWhatsapp ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <a
            href={telHref(phone)}
            onClick={() => {
              if (craftsmanSlug) track(craftsmanSlug, "call");
            }}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
          >
            <IconPhone className="h-5 w-5" />
            اتصل
          </a>
          {hasWhatsapp && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (craftsmanSlug) track(craftsmanSlug, "whatsapp");
              }}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-3 text-base font-bold text-on-action transition-colors hover:bg-action/90"
            >
              <IconWhatsApp className="h-5 w-5" />
              واتساب
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
