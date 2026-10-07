"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabase } from "@/lib/db/client";

/**
 * تحديث لحظي لصفحات العروض: أي ردّ جديد (`lead_responses`) أو إشعار ليدز
 * جديد في `notifications` (صفوف المالك فقط عبر RLS — مُرشَّح بأنواع الليدز
 * حتى لا تتحدث الصفحة مع كل إشعار آخر) يُعاد معه رسم الـ Server
 * Component بـ router.refresh().
 *
 * ملاحظة سرية: جدول `leads` نفسه خارج منشور supabase_realtime عمداً
 * (20261006000014) — الـ payload الكامل كان يحمل `customer_phone` لأي
 * صانع مخوّل بقراءة الصف، متجاوزاً منح الأعمدة. الاكتشاف يتم عبر
 * إشعارات `lead_new`/`lead_claimed`/… بدل قراءة الصف نفسه.
 *
 * `onLeadInserted` (اختياري): يُستدعى بمعرف الطلب عند وصول إشعار
 * `lead_new` — تستخدمه لوحة الفني لتمييز الكارت الجديد (التنبيه الصوتي/
 * المرئي نفسه يغطيه `NotificationsToast` العام).
 */
const LEADS_NOTIFICATION_FILTER =
  "type=in.(lead_new,lead_claimed,lead_completed,lead_cancelled,lead_expired,lead_withdrawn,lead_renewed)";
export function useLeadsRealtime(
  enabled: boolean = true,
  opts?: { onLeadInserted?: (leadId: string) => void },
) {
  const router = useRouter();
  const onLeadInsertedRef = useRef(opts?.onLeadInserted);
  useEffect(() => {
    onLeadInsertedRef.current = opts?.onLeadInserted;
  });

  useEffect(() => {
    if (!enabled) return;

    const supabase = createSupabase();
    let refreshTimer: number | undefined;

    // تجميع الأحداث المتلاحقة في تحديث واحد (debounce خفيف)
    const scheduleRefresh = () => {
      if (refreshTimer !== undefined) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = undefined;
        router.refresh();
      }, 400);
    };

    const channel = supabase
      .channel("leads-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: LEADS_NOTIFICATION_FILTER,
        },
        (payload: {
          new?: { type?: string; metadata?: { lead_id?: unknown } } | null;
        }) => {
          scheduleRefresh();
          // طلب جديد للفني: الإشعار وحده يحمل المعرف (بلا PII في الـ payload)
          if (payload?.new?.type === "lead_new") {
            const leadId = payload.new.metadata?.lead_id;
            if (typeof leadId === "string" && leadId.length > 0) {
              onLeadInsertedRef.current?.(leadId);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_responses" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [enabled, router]);
}
