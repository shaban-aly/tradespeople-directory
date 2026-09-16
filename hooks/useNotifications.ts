"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import {
  getUnreadNotificationsCount,
  getUserNotifications,
  markNotificationsRead,
  type NotificationRow,
} from "@/lib/db/notifications";

const POLL_INTERVAL_MS = 45 * 1000;

export function useNotifications() {
  const { user, isLoggedIn } = useSession();
  const activeUser = isLoggedIn && user?.id ? user.id : null;
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // إبطال أي ردود قديمة عند تبديل المستخدم أو تسجيل الخروج
  const userIdRef = useRef<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!activeUser) {
      userIdRef.current = null;
      return;
    }

    if (userIdRef.current === activeUser) {
      return;
    }
    userIdRef.current = activeUser;

    const seq = ++requestSeq.current;
    let isActive = true;

    const refresh = async () => {
      if (!isActive || !userIdRef.current) return;
      setLoading(true);
      const [list, count] = await Promise.all([
        getUserNotifications(userIdRef.current),
        getUnreadNotificationsCount(userIdRef.current),
      ]);
      if (!isActive || seq !== requestSeq.current) return;
      setItems(list);
      setUnreadCount(count);
      setLoading(false);
    };

    void refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      clearInterval(timer);
    };
  }, [activeUser]);

  const markAllRead = useCallback(async () => {
    const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // تحديث تفاؤلي فوري (واجهة سلسة) مع مزامنة لاحقة بالقاعدة
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
    setUnreadCount(0);

    await markNotificationsRead(unreadIds);
  }, [items]);

  // أثناء تسجيل الخروج أو تبديل الحساب نُخفِي أي بيانات مخزنة فوراً
  // (لا نتفريغ بالـ effect بل بقيم مشتقة — لا إعادة رندر متتالية)
  const visibleItems = activeUser ? items : [];
  const visibleCount = activeUser ? unreadCount : 0;

  return {
    items: visibleItems,
    unreadCount: visibleCount,
    loading: activeUser ? loading : false,
    markAllRead,
  };
}