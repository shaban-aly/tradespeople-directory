"use client";

import { useSession } from "@/hooks/auth/useSession";
import { IconLogOut } from "@/components/shared/icons";

export function SignOutButton() {
  const { signOut } = useSession();

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-500/10 active:scale-[0.99]"
    >
      <IconLogOut className="h-4 w-4" />
      <span>تسجيل الخروج من الحساب</span>
    </button>
  );
}