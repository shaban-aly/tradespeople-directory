"use client";

import { useEffect, useState } from "react";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { IconAlert, IconExternalLink, IconX } from "@/components/shared/icons";
import { track } from "@/lib/analytics/track";
import type {
  ExternalOpenHref,
  InAppBrowserKind,
  TrafficSource,
} from "@/lib/auth/detectBrowser";

interface InAppBrowserNoticeProps {
  browser: InAppBrowserKind;
  source: TrafficSource;
  open: ExternalOpenHref;
}

export function InAppBrowserNotice({
  browser,
  source,
  open,
}: InAppBrowserNoticeProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    track("in_app_browser_notice", { shown: true, browser, source });
  }, [browser, source]);

  if (dismissed) return null;

  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 text-right shadow-sm">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={() => {
          track("in_app_browser_notice", {
            shown: true,
            action: "dismissed",
            browser,
            source,
          });
          setDismissed(true);
        }}
        className="absolute left-3 top-3 rounded-lg p-1.5 text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
      >
        <IconX className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <IconAlert className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-base font-extrabold text-foreground">
            سجّل دخولك في المتصفح الخارجي
          </h2>
          <p className="mt-1 text-base leading-relaxed text-muted">
            صفحة تسجيل الدخول لا تعمل داخل متصفح التطبيق المضمّن. افتح الموقع في
            متصفحك لتكمل تسجيل الدخول كالمعتاد.
          </p>
          <p className="mt-1 text-sm text-muted">
            هيوصلك بعد الدخول لنفس المكان اللي كنت فيه.
          </p>
        </div>
      </div>

      <ButtonAnchor
        href={open.href}
        target={open.target}
        rel={open.rel}
        variant="primary"
        size="md"
        className="mt-4 w-full"
        onClick={() => {
          track("in_app_browser_notice", {
            shown: true,
            action: "open_external",
            browser,
            source,
          });
        }}
      >
        <IconExternalLink className="h-5 w-5" />
        افتح الموقع في المتصفح
      </ButtonAnchor>
    </div>
  );
}