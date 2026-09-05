"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { buttonClasses } from "@/components/shared/ui/Button";
import { CopyPhoneButton } from "@/components/shared/ui/CopyPhoneButton";
import { useStats } from "@/hooks/useStats";
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
  categoryName,
}: {
  phone: string;
  whatsapp: string;
  craftsmanSlug?: string;
  craftsmanName?: string;
  categoryName?: string;
}) {
  const { track } = useStats();
  const hasWhatsapp = Boolean(whatsapp);
  const waUrl = whatsappHref(
    whatsapp,
    craftsmanName
      ? craftsmanWhatsappMessage(craftsmanName, categoryName)
      : undefined,
  );

  return (
    <div className="sticky bottom-3 z-20 sm:hidden">
      <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-up backdrop-blur">
        <p className="mb-2 flex items-center justify-center gap-1.5 text-sm text-muted">
          <span>اتصل مباشرة على</span>
          <bdi className="font-bold text-foreground" dir="ltr">
            {phone}
          </bdi>
          <CopyPhoneButton phone={phone} iconOnly />
        </p>
        <div
          className={`grid gap-2 ${hasWhatsapp ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <a
            href={telHref(phone)}
            onClick={() => {
              if (craftsmanSlug) track(craftsmanSlug, "call");
            }}
            className={buttonClasses("primary", "md")}
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
              className={buttonClasses("action", "md")}
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
