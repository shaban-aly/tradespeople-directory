"use client";

import { createContext, useCallback, useRef, useState } from "react";
import { IconAlert, IconCheck, IconX } from "@/components/shared/icons";

export type ToastType = "success" | "error";

export type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

export type ToastContextValue = {
  toasts: ToastItem[];
  toast: (type: ToastType, message: string) => void;
  dismiss: (id: number) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-card ${
              item.type === "success"
                ? "border-action/40 bg-action/10 text-foreground"
                : "border-danger/40 bg-danger/10 text-foreground"
            }`}
          >
            {item.type === "success" ? (
              <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-action" />
            ) : (
              <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            )}
            <p className="min-w-0 flex-1 text-base font-bold">{item.message}</p>
            <button
              type="button"
              aria-label="إغلاق الإشعار"
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:text-foreground"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
