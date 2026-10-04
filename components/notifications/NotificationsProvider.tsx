"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useNotificationsStore,
  type NotificationsContextValue,
} from "@/hooks/useNotificationsStore";

/**
 * مزوّد الحالة الوحيد على مستوى الشجرة — ومركّب في `app/layout.tsx` فيغطي
 * الموقع ولوحتَي Artisan/الإدارة معاً.
 *
 * كل المنطق (الجلب، الاستطلاع، Realtime، العدّاد، rollback، عزل تبديل الحساب)
 * يعيش في `hooks/useNotificationsStore.ts`؛ هذا الملف مسؤول عن Context فقط
 * كما تقتضي قاعدة فصل المنطق عن التصميم.
 */
const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const value = useNotificationsStore();
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}

export type { NotificationsContextValue };