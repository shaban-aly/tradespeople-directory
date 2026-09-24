"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" } | undefined>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWA_OPEN_INSTALL_EVENT = "tradespeople:pwa:install";

export function triggerPwaInstall() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PWA_OPEN_INSTALL_EVENT));
  }
}

let globalDeferredPrompt: InstallPromptEvent | null = null;

export function _resetGlobalDeferredPrompt() {
  globalDeferredPrompt = null;
}

const DISMISSED_KEY = "pwa-install-dismissed-at";
const LEGACY_DISMISSED_KEY = "pwa-install-dismissed";
const DISMISS_COOLOFF_MS = 14 * 24 * 60 * 60 * 1000; // 14 يوماً

function checkIsIos(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isWithinCooloff(): boolean {
  try {
    const legacy = localStorage.getItem(LEGACY_DISMISSED_KEY);
    const modern = localStorage.getItem(DISMISSED_KEY);
    if (!modern && legacy === "1") {
      // نقل المفتاح القديم لمفتاح الطابع الزمني لعدم حرمان المستخدم نهائياً
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      localStorage.removeItem(LEGACY_DISMISSED_KEY);
      return true;
    }
    if (!modern) return false;
    const dismissedAt = Number(modern);
    if (Number.isNaN(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_COOLOFF_MS;
  } catch {
    return false;
  }
}

export function useInstallPrompt() {
  const deferredPromptRef = useRef<InstallPromptEvent | null>(globalDeferredPrompt);
  const [hasPrompt, setHasPrompt] = useState(Boolean(globalDeferredPrompt));
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone = checkIsStandalone();
    const ios = checkIsIos();
    setIsIos(ios);

    if (standalone) {
      setInstalled(true);
      return;
    }

    if (isWithinCooloff()) {
      setDismissed(true);
    }

    if (globalDeferredPrompt && !deferredPromptRef.current) {
      deferredPromptRef.current = globalDeferredPrompt;
      setHasPrompt(true);
    }

    const isStandaloneQuery = window.matchMedia("(display-mode: standalone)");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as InstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      deferredPromptRef.current = promptEvent;
      setHasPrompt(true);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      deferredPromptRef.current = null;
      setHasPrompt(false);
      setInstalled(true);
      setShowIosGuide(false);
    };

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        globalDeferredPrompt = null;
        deferredPromptRef.current = null;
        setHasPrompt(false);
        setInstalled(true);
        setShowIosGuide(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    isStandaloneQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      isStandaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    const promptEvent = deferredPromptRef.current || globalDeferredPrompt;
    if (promptEvent) {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      const accepted = result?.outcome === "accepted";
      globalDeferredPrompt = null;
      deferredPromptRef.current = null;
      setHasPrompt(false);
      if (accepted) {
        setInstalled(true);
      }
      return accepted;
    }

    // إذا كان آيفون: فتح نافذة الدليل التوضيحي
    if (isIos) {
      setShowIosGuide(true);
      return false;
    }

    return false;
  }, [isIos]);

  const dismiss = useCallback(() => {
    deferredPromptRef.current = null;
    setHasPrompt(false);
    setDismissed(true);
    setShowIosGuide(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore storage access errors
    }
  }, []);

  const openInstallGuide = useCallback(() => {
    if (isIos) {
      setShowIosGuide(true);
    }
    triggerPwaInstall();
  }, [isIos]);

  // إمكانية التثبيت الآلي عبر البانر (غير مثبت + غير مغلق خلال مهلة الـ 14 يوماً + متوفر prompt أو جهاز iOS)
  const canShowAutoBanner =
    !installed &&
    !dismissed &&
    (hasPrompt || (isIos && !installed));

  // إمكانية التثبيت اليدوي من الفوتر أو القائمة في أي وقت (طالما ليس مثبتاً بالفعل)
  const canInstall = !installed;

  return {
    available: canShowAutoBanner,
    canInstall,
    installed,
    isIos,
    showIosGuide,
    setShowIosGuide,
    openInstallGuide,
    install,
    dismiss,
  };
}