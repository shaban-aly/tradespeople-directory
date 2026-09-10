"use client";

import Image from "next/image";
import { IconDownload, IconX } from "@/components/shared/icons";
import { Button } from "@/components/shared/ui/Button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function PwaInstallBanner() {
  const { available, install, dismiss } = useInstallPrompt();

  if (!available) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex items-start gap-3">
          <Image
            src="/web-app-manifest-192x192.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-xl"
            unoptimized
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-foreground">
                ثبّت تطبيق دليل الصنايعية
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
            <p className="mt-0.5 text-sm text-muted">
              حمّل التطبيق على جهازك ودايماً في متناول يدك بنقرة واحدة من
              الشاشة.
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="action"
            size="md"
            className="flex-1"
            onClick={() => void install()}
          >
            <IconDownload className="h-5 w-5" />
            تثبيت التطبيق
          </Button>
          <Button variant="ghost" size="md" onClick={dismiss}>
            لاحقاً
          </Button>
        </div>
      </div>
    </div>
  );
}