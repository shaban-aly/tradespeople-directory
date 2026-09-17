"use client";

import type { User } from "@supabase/supabase-js";
import { useSessionContext } from "@/hooks/auth/SessionProvider";

export type UserRole = "client" | "craftsman" | "admin";

export interface SessionProfile {
  role: UserRole;
  craftsmanId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface SessionState {
  user: User | null;
  profile: SessionProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isCraftsman: boolean;
  isClient: boolean;
  isLoggedIn: boolean;
}

/**
 * حالة الجلسة الموحدة — تقرأ من SessionProvider المشتركة في جذر التطبيق
 * حتى يرى كل المستهلكين (Favorites, UserMenu, BottomNav, AuthGuard ...)
 * نفس الحالة عبر كل الأكواد زمنياً؛ لا يتكرر جلب الجلسة في كل كومبوننت.
 */
export function useSession(): SessionState & { signOut: (redirectTo?: string) => Promise<void> } {
  const session = useSessionContext();
  return {
    user: session.user,
    profile: session.profile,
    loading: session.loading,
    isAdmin: session.isAdmin,
    isCraftsman: session.isCraftsman,
    isClient: session.isClient,
    isLoggedIn: session.isLoggedIn,
    signOut: session.signOut,
  };
}