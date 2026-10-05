"use client";

import { useNotificationsContext } from "@/components/notifications/NotificationsProvider";

/**
 * قارئ حالة الإشعارات الموحّد.
 *
 * لم يعد هذا الـ hook يملك حالة — كل المنطق (الجلب، الاستطلاع، Realtime،
 * العدّاد، rollback) يعيش في `useNotificationsStore` داخل `hooks/`.
 * و`NotificationsProvider` لم يبقَ سوى مزوّد Context رقيق يبني الحالة مرة
 * واحدة ويوزّعها. وجود الـ hook هنا كواجهة قراءة واحدة يستهلكها الجرس
 * وصفحة /notifications والـ Toast، فأي تعديل في الحالة ينعكس على كلهم في
 * الرندر التالي مباشرة.
 */
export function useNotifications() {
  const {
    items,
    visibleItems,
    unreadCount,
    loading,
    error,
    markingAll,
    markError,
    refresh,
    markAsRead,
    markAllRead,
    dismissMarkError,
  } = useNotificationsContext();

  return {
    items,
    visibleItems,
    unreadCount,
    loading,
    error,
    markingAll,
    markError,
    refresh,
    markAsRead,
    markAllRead,
    dismissMarkError,
  };
}
