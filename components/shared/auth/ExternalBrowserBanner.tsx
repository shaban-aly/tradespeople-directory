"use client";

import { useEffect, useState } from "react";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { IconExternalLink, IconX } from "@/components/shared/icons";
import { useSession } from "@/hooks/auth/useSession";
import { useExternalBrowserPrompt } from "@/hooks/ui/useExternalBrowserPrompt";
import { useHydratedValue } from "@/hooks/ui/useHydratedValue";
import { track } from "@/lib/analytics/track";
import {
  detectMobileBrowserKind,
  openInExternalBrowser,
} from "@/lib/auth/detectBrowser";

const DISMISS_KEY = "sanay:external-browser-prompt";

interface ExternalBrowserBannerProps {
  /** مهلة قبل ظهور الشريط (بالميلي ثانية) — الافتراضي 10 ثوانٍ */
  delayMs?: number;
}

/**
 * شريط سفلي عام يظهر تلقائيًا على أي صفحة بعد مهلة قصيرة عندما يفتح الزائر
 * الموقع من موبايل في متصفح مضمّن (فيسبوك...) أو متصفح جوال ثانوي.
 * الهدف: نقل الزائر إلى متصفح الجهاز الأساسي (كروم/سفاري) الذي يكون عليه
 * حساب جيميل جاهزًا، حتى يصبح تسجيل الدخول بجوجل نقرة واحدة بدل إدخال
 * الجيميل على الموبايل. لا يظهر أبدًا على الديسكتوب أو لمسجّل الدخول،
 * ويُغلق مرة واحدة لكل جلسة.
 */
export function ExternalBrowserBanner({ delayMs = 10_000 }: ExternalBrowserBannerProps) {
  const { isLoggedIn, loading: sessionLoading } = useSession();
  const { ua, shouldPrompt } = useExternalBrowserPrompt();
  const dismissed = useHydratedValue(false, () => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dismissed || sessionLoading || isLoggedIn) return;
    const timer = setTimeout(() => {
      setVisible(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [dismissed, sessionLoading, isLoggedIn, delayMs]);

  if (!shouldPrompt || dismissed || sessionLoading || isLoggedIn || !visible) {
    return null;
  }

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // تجاهل
    }
    track("external_browser_prompt", { shown: true, action: "dismissed" });
    setVisible(false);
  };

  const openExternal = () => {
    track("external_browser_prompt", {
      shown: true,
      action: "open",
      browser: detectMobileBrowserKind(ua) ?? "other",
    });
    setVisible(false);
    openInExternalBrowser(window.location.href, ua);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-50 flex justify-center px-4 sm:bottom-4">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconExternalLink className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-foreground">
                افتح الموقع في متصفحك الأساسي
              </h2>
              <button
                type="button"
                onClick={dismiss}
                aria-label="إغلاق"
                className="flex h-10 w-10 -m-1 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              لو سجّلت دخولك بجوجل، اتفتح في كروم أو سفاري وهيوصلك الحساب
              جاهز — تسجيل الدخول هيبقى نقرة واحدة.
            </p>
          </div>
        </div>
        <ButtonAnchor
          href="#"
          variant="primary"
          size="md"
          className="mt-3 w-full"
          onClick={(event) => {
            event.preventDefault();
            openExternal();
          }}
        >
          <IconExternalLink className="h-5 w-5" />
          افتح في كروم/سفاري
        </ButtonAnchor>
      </div>
    </div>
  );
}