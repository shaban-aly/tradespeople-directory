"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/hooks/auth/useSession";
import {
  subscribeToNotifications,
  type NotificationRow,
} from "@/lib/db/notificationsRealtime";

/**
 * اشتراك Realtime على جدول `notifications` حسب صاحب الجلسة.
 *
 * يشترك مع الناقل المشترك (`subscribeToNotifications`) بدل إنشاء قناة
 * مستقلة — لأن `createSupabase()` عائد client واحد لنفس الاسم، وإنشاء
 * قناتين من مكوّنين (جرس الـ header + Toast) يكسر الثاني عند `subscribe`.
 *
 * عند كل إدراج جديد يصل صف للمستخدم يُستدعى onNew. الجدول مُضاف لنشر
 * `supabase_realtime` في migration 0013 (idempotent).
 */
export function useRealtimeNotifications(onNew: (row: NotificationRow) => void) {
  const { user, isLoggedIn } = useSession();
  const onNewRef = useRef(onNew);

  useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    return subscribeToNotifications(user.id, (row) => {
      onNewRef.current(row);
    });
  }, [isLoggedIn, user?.id]);
}