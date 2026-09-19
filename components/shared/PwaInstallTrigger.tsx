"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { IconDownload } from "@/components/shared/icons";

export function PwaInstallTrigger() {
  const { canInstall, openInstallGuide } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <li>
      <button
        type="button"
        onClick={openInstallGuide}
        className="flex items-center gap-1.5 text-base text-muted transition-colors hover:text-accent cursor-pointer text-start"
      >
        <IconDownload className="h-4 w-4 shrink-0 text-accent" />
        <span>تثبيت التطبيق على جهازك</span>
      </button>
    </li>
  );
}
