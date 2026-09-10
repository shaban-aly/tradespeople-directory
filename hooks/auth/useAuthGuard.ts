"use client";

import { useCallback, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";

export interface AuthGuardOptions {
  title?: string;
  message?: string;
  actionDescription?: string;
}

export function useAuthGuard() {
  const { isLoggedIn, loading } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [guardOptions, setGuardOptions] = useState<AuthGuardOptions>({});
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback(
    (action: () => void, options?: AuthGuardOptions): boolean => {
      if (loading) return false;

      if (isLoggedIn) {
        action();
        return true;
      }

      setGuardOptions(options ?? {});
      setPendingAction(() => action);
      setIsOpen(true);
      return false;
    },
    [isLoggedIn, loading]
  );

  const handleSuccess = useCallback(() => {
    setIsOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
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
