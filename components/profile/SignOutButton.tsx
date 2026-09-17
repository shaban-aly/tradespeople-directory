"use client";

import { useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { IconLogOut } from "@/components/shared/icons";

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
      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-500/10 active:scale-[0.99] disabled:opacity-50"
    >
      <IconLogOut className="h-4 w-4" />
      <span>{loggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج من الحساب"}</span>
    </button>
  );
}