"use client";

import { useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { IconChevronLeft, IconLogOut } from "@/components/shared/icons";

/**
 * زر تسجيل الخروج بنمط صف إعدادات ناعم وموحد (نمط WhatsApp & Apple Settings).
 */
export function SignOutButton() {
  const { signOut } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut("/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loggingOut}
      onClick={() => void handleSignOut()}
      className="w-full min-h-12 flex items-center justify-between px-4 py-3.5 text-right transition-colors hover:bg-danger/5 group disabled:opacity-50 cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger transition-colors group-hover:bg-danger group-hover:text-on-danger">
          <IconLogOut className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-danger">
            {loggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج من الحساب"}
          </p>
          <p className="text-xs text-muted truncate">
            إنهاء الجلسة والرجوع لتصفح الدليل كزائر
          </p>
        </div>
      </div>
      <IconChevronLeft className="h-5 w-5 text-danger/60 transition-transform group-hover:-translate-x-1 shrink-0" />
    </button>
  );
}