"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabase } from "@/lib/db/client";
import { performSignOut } from "@/lib/auth/logout";
import { syncDevicePushOnLogin } from "@/lib/push/activation";
import type { SessionProfile, UserRole } from "@/hooks/auth/useSession";

export interface SessionContextValue {
  user: User | null;
  profile: SessionProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isCraftsman: boolean;
  isClient: boolean;
  signOut: (redirectTo?: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionContext(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return session;
}

async function fetchProfile(
  userId: string,
): Promise<SessionProfile | null> {
  const { data } = await createSupabase()
    .from("profiles")
    .select("role, craftsman_id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    role: data.role as UserRole,
    craftsmanId: data.craftsman_id ?? null,
    displayName: data.display_name ?? null,
    avatarUrl: data.avatar_url ?? null,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    const {
      data: { user: nextUser },
    } = await createSupabase().auth.getUser();
    setUser(nextUser ?? null);
    setProfile(nextUser ? await fetchProfile(nextUser.id) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void sync(), 0);
    const {
      data: { subscription },
    } = createSupabase().auth.onAuthStateChange((event, session) => {
      void sync();
      if (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && session?.user)) {
        void syncDevicePushOnLogin();
      }
    });
    return () => {
      window.clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [sync]);

  const signOut = useCallback(async (redirectTo = "/") => {
    await performSignOut();
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
      try {
        if (window.location.pathname === redirectTo) {
          window.location.reload();
        } else {
          window.location.href = redirectTo;
        }
      } catch {
        // Fallback for unexpected browser environment issues
      }
    }
  }, []);

  const role = profile?.role ?? null;

  const value: SessionContextValue = {
    user,
    profile,
    loading,
    isLoggedIn: !!user,
    isAdmin: role === "admin",
    isCraftsman: role === "craftsman",
    isClient: role === "client",
    signOut,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
