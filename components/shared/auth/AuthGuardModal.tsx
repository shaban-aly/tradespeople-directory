"use client";

import { useEffect } from "react";
import { IconLock, IconX } from "@/components/shared/icons";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
        aria-label="إغلاق النافذة"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* بطاقة المودال */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card text-center sm:p-8">
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

        {/* زر تسجيل الدخول المباشر بجوجل */}
        <div className="mt-6 flex flex-col items-center justify-center">
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
