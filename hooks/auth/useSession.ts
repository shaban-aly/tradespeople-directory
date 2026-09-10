"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabase } from "@/lib/db/client";

export type UserRole = "client" | "craftsman" | "admin";

export interface SessionProfile {
  role: UserRole;
  craftsmanId: string | null;
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

async function fetchProfile(userId: string): Promise<SessionProfile | null> {
  const { data } = await createSupabase()
    .from("profiles")
    .select("role, craftsman_id")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    role: data.role as UserRole,
    craftsmanId: data.craftsman_id ?? null,
  };
}

export function useSession() {
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
    } = createSupabase().auth.onAuthStateChange(() => void sync());
    return () => {
      window.clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [sync]);

  async function signOut() {
    await createSupabase().auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const role = profile?.role ?? null;

  return {
    user,
    profile,
    loading,
    isLoggedIn: !!user,
    isAdmin: role === "admin",
    isCraftsman: role === "craftsman",
    isClient: role === "client",
    signOut,
  } satisfies SessionState & { signOut: () => Promise<void> };
}
