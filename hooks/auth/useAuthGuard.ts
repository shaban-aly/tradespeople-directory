"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSession } from "@/hooks/auth/useSession";

export interface AuthGuardOptions {
  title?: string;
  message?: string;
  actionDescription?: string;
}

export function useAuthGuard() {
  const { isLoggedIn, loading } = useSession();
  const [guardOptions, setGuardOptions] = useState<AuthGuardOptions>({});
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [, startTransition] = useTransition();

  const requireAuth = useCallback(
    (action: () => void, options?: AuthGuardOptions): boolean => {
      setGuardOptions(options ?? {});

      if (loading) {
        setPendingAction(() => action);
        return false;
      }

      if (isLoggedIn) {
        action();
        return true;
      }

      setPendingAction(() => action);
      setModalDismissed(false);
      return false;
    },
    [isLoggedIn, loading],
  );

  // بعد اكتمال الجلسة: مسجّل → يُنفَّذ الإجراء المحجوز تلقائياً
  useEffect(() => {
    if (loading || !pendingAction || !isLoggedIn) return;
    const next = pendingAction;
    startTransition(() => {
      setPendingAction(null);
    });
    next();
  }, [loading, isLoggedIn, pendingAction, startTransition]);

  // المودال مفتوح فقط: إجراء معلّق + جلسة زائر + لم يُرفض من المستخدم
  const isOpen =
    !loading && !isLoggedIn && pendingAction !== null && !modalDismissed;

  const handleSuccess = useCallback(() => {
    setModalDismissed(true);
  }, []);

  const handleClose = useCallback(() => {
    setPendingAction(null);
    setModalDismissed(true);
  }, []);

  return {
    isOpen,
    guardOptions,
    requireAuth,
    handleSuccess,
    handleClose,
    isLoggedIn,
  };
}