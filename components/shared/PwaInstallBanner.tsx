"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IconDownload, IconX, IconShare, IconPlus } from "@/components/shared/icons";
import { Button } from "@/components/shared/ui/Button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function PwaInstallBanner() {
  const {
    available,
    isIos,
    showIosGuide,
    setShowIosGuide,
    install,
    dismiss,
  } = useInstallPrompt();

  const [delayedVisible, setDelayedVisible] = useState(false);

  // تأخير الظهور التلقائي 3.5 ثوانٍ بعد فتح الصفحة لتجنب المباغتة
  useEffect(() => {
    if (!available) {
      setDelayedVisible(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setDelayedVisible(true);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [available]);

  const isVisible = showIosGuide || (available && delayedVisible);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5 transition-all animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-start gap-3">
          <Image
            src="/web-app-manifest-192x192.png"
            alt="شعار دليل الصنايعية"
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-2xl shadow-xs"
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
                aria-label="إغلاق التنبيه"
                className="flex h-9 w-9 -m-1 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-muted leading-relaxed">
              تصفح الدليل ووصول فوري لأرقام الصنايعية في السويس بضغطة زر من شاشتك الرئيسية.
            </p>
          </div>
        </div>

        {/* دليل التثبيت الخاص بأجهزة آبل iOS */}
        {showIosGuide ? (
          <div className="mt-3.5 rounded-2xl border border-accent/20 bg-accent/5 p-3.5 text-xs text-foreground">
            <div className="mb-2 font-bold text-accent">
              خطوات التثبيت على الآيفون والآيباد:
            </div>
            <ol className="space-y-2 text-muted">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-accent text-[11px]">
                  1
                </span>
                <span>
                  اضغط على زر المشاركة{" "}
                  <IconShare className="inline-block h-3.5 w-3.5 text-accent mx-0.5" />{" "}
                  في شريط سفاري بالأسفل.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-accent text-[11px]">
                  2
                </span>
                <span>
                  مرر القائمة لأسفل واختر{" "}
                  <strong className="text-foreground">
                    «إضافة إلى الشاشة الرئيسية»{" "}
                    <IconPlus className="inline-block h-3.5 w-3.5 text-accent mx-0.5" />
                  </strong>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-accent text-[11px]">
                  3
                </span>
                <span>
                  اضغط على كلمة <strong className="text-foreground">«إضافة» (Add)</strong> في أعلى الزاوية.
                </span>
              </li>
            </ol>
            <div className="mt-3 pt-2 border-t border-accent/15 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-xs font-bold text-accent hover:underline"
              >
                فهمت ذلك، إغلاق الدليل
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3.5 flex gap-2">
            <Button
              variant="action"
              size="md"
              className="flex-1 font-bold"
              onClick={() => {
                if (isIos) {
                  setShowIosGuide(true);
                } else {
                  void install();
                }
              }}
            >
              <IconDownload className="h-5 w-5" />
              تثبيت التطبيق
            </Button>
            <Button variant="ghost" size="md" onClick={dismiss}>
              لاحقاً
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}