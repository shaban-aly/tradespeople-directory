"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabase } from "@/lib/db/client";

type ProfileRow = {
  is_admin: boolean;
};

async function getAdminFlag(userId: string): Promise<boolean> {
  const { data } = (await createSupabase()
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle()) as { data: ProfileRow | null };
  return Boolean(data?.is_admin);
}

export function useAdminSession() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncSession = useCallback(async () => {
    const {
      data: { user: nextUser },
    } = await createSupabase().auth.getUser();
    setUser(nextUser ?? null);
    setIsAdmin(nextUser ? await getAdminFlag(nextUser.id) : false);
    setLoading(false);
  }, []);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      void syncSession();
    }, 0);
    const {
      data: { subscription },
    } = createSupabase().auth.onAuthStateChange(() => {
      void syncSession();
    });
    return () => {
      window.clearTimeout(syncTimer);
      subscription.unsubscribe();
    };
  }, [syncSession]);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await createSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) return "بيانات الدخول غير صحيحة";

    const {
      data: { user: nextUser },
    } = await createSupabase().auth.getUser();
    if (!nextUser) return "مقدرناش نثبت الجلسة";

    const admin = await getAdminFlag(nextUser.id);
    if (!admin) {
      await createSupabase().auth.signOut();
      return "الحساب ده مش مخوّل كـ مشرف";
    }

    setUser(nextUser);
    setIsAdmin(true);
    return null;
  }

  async function signOut() {
    await createSupabase().auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }

  return {
    user,
    isAdmin,
    loading,
    signIn,
    signOut,
  };
}
