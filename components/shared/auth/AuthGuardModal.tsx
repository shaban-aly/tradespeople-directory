"use client";

import { useRef } from "react";
import { IconExternalLink, IconLock, IconX } from "@/components/shared/icons";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { useExternalBrowserPrompt } from "@/hooks/ui/useExternalBrowserPrompt";
import { useFocusTrap } from "@/hooks/ui/useFocusTrap";
import {
  detectMobileBrowserKind,
  openInExternalBrowser,
} from "@/lib/auth/detectBrowser";
import { track } from "@/lib/analytics/track";

export interface AuthGuardModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  message?: string;
  actionDescription?: string;
}

export function AuthGuardModal({
  open,
  onClose,
  onSuccess,
  title = "تسجيل الدخول مطلوب",
  message = "يرجى تسجيل الدخول بحساب جوجل للمتابعة والاستفادة من هذه الميزة.",
  actionDescription,
}: AuthGuardModalProps) {
  const { ua, shouldPrompt: mobileBrowser } = useExternalBrowserPrompt();
  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(cardRef, open, { onClose });

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-guard-title"
      className="fixed inset-0 z-80 flex items-center justify-center p-4"
    >
      {/* خلفية معتمة قابلة للنقر للإغلاق */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="إغلاق النافذة"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* بطاقة المودال */}
      <div
        ref={cardRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card text-center sm:p-8 focus:outline-none"
      >
        {/* زر إغلاق علوي */}
        <button
          type="button"
          aria-label="إغلاق"
          onClick={onClose}
          className="absolute left-4 top-4 rounded-xl p-2 text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
        >
          <IconX className="h-5 w-5" />
        </button>

        {/* أيقونة حارس مع حلقة مميزة */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-8 ring-accent/5">
          <IconLock className="h-8 w-8" />
        </div>

        {/* العنوان والوصف */}
        <h3
          id="auth-guard-title"
          className="font-heading text-xl font-extrabold text-foreground sm:text-2xl"
        >
          {title}
        </h3>
        <p className="mt-2 text-base text-muted leading-relaxed">
          {message}
        </p>

        {/* إبراز الإجراء المطلوب */}
        {actionDescription && (
          <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/5 p-3.5 text-sm text-foreground">
            {actionDescription}
          </div>
        )}

        {/* زر تسجيل الدخول المباشر بجوجل / أو توجيه موبايل المتصفحات المضمّنة */}
        <div className="mt-6 flex flex-col items-center justify-center">
          {mobileBrowser ? (
            <div className="w-full">
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3.5 text-sm text-foreground">
                تسجيل الدخول بجوجل لا يعمل داخل متصفح التطبيق المضمّن أو
                متصفحات الموبايل الثانوية. افتح انضمامك في متصفحك الأساسي
                (كروم/سفاري) اللي عليه حساب جيميل جاهز.
              </div>
              <ButtonAnchor
                href="#"
                variant="primary"
                size="md"
                className="mt-3 w-full"
                onClick={(event) => {
                  event.preventDefault();
                  track("external_browser_prompt", {
                    shown: true,
                    action: "auth_guard_open",
                    browser: detectMobileBrowserKind(ua) ?? "other",
                  });
                  openInExternalBrowser(window.location.href, ua);
                }}
              >
                <IconExternalLink className="h-5 w-5" />
                افتح في كروم/سفاري
              </ButtonAnchor>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <GoogleSignInButton
                onSuccess={() => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    onClose();
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* خيار الإلغاء */}
        <div className="mt-5 border-t border-border/50 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            المتابعة كزائر الآن
          </button>
        </div>
      </div>
    </div>
  );
}
