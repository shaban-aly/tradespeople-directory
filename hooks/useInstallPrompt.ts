"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" } | undefined>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function useInstallPrompt() {
  const deferredPromptRef = useRef<InstallPromptEvent | null>(null);
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;

    const isStandaloneQuery = window.matchMedia("(display-mode: standalone)");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      try {
        if (localStorage.getItem(DISMISSED_KEY) === "1") return;
      } catch {
        // ignore storage access errors
      }
      deferredPromptRef.current = event as InstallPromptEvent;
      setAvailable(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setAvailable(false);
      setInstalled(true);
    };

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        deferredPromptRef.current = null;
        setAvailable(false);
        setInstalled(true);
      }
    };

    if (isStandaloneQuery.matches) {
      queueMicrotask(() => setInstalled(true));
      return;
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    isStandaloneQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      isStandaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return false;

    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    const accepted = result?.outcome === "accepted";

    deferredPromptRef.current = null;
    setAvailable(false);
    if (accepted) setInstalled(true);
    return accepted;
  }, []);

  const dismiss = useCallback(() => {
    deferredPromptRef.current = null;
    setAvailable(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore storage access errors
    }
  }, []);

  return {
    available: available && !installed && !dismissed,
    install,
    dismiss,
  };
}