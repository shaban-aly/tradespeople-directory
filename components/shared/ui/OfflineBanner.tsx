"use client";

import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "@/hooks/ui/useOnlineStatus";
import { IconCheck } from "@/components/shared/icons";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setShowRestored(false);
    } else if (wasOfflineRef.current) {
      // عاد الاتصال بعد انقطاعه
      setShowRestored(true);
      const timer = window.setTimeout(() => {
        setShowRestored(false);
        wasOfflineRef.current = false;
      }, 2500);
      return () => window.clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showRestored) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-100 flex justify-center p-3"
    >
      <div
        className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-lg transition-all animate-in slide-in-from-top-4 duration-300 ${
          showRestored
            ? "border border-action/40 bg-action text-white"
            : "border border-danger/30 bg-danger text-white"
        }`}
      >
        {showRestored ? (
          <>
            <IconCheck className="h-4 w-4" />
            <span>تم استعادة الاتصال بالإنترنت</span>
          </>
        ) : (
          <>
            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            <span>أنت غير متصل بالإنترنت حالياً</span>
          </>
        )}
      </div>
    </div>
  );
}
