"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useRealtimeNotifications } from "@/hooks/notifications/useRealtimeNotifications";
import {
  getUnreadNotificationsCount,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  type NotificationRow,
} from "@/lib/db/notifications";

const POLL_INTERVAL_MS = 45 * 1000;

/** جلب واحد يخدم الجرس والصفحة معاً (الحد الأعلى للصفحة الكاملة) */
const FETCH_LIMIT = 200;

/** الجرس يعرض أحدث 50 فقط — تقطيع عرضي بلا جلب إضافي */
export const BELL_VISIBLE_LIMIT = 50;

export interface NotificationsContextValue {
  items: NotificationRow[];
  /** العناصر التي يعرضها الجرس (أحدث subset من نفس القائمة) */
  visibleItems: NotificationRow[];
  unreadCount: number;
  loading: boolean;
  /** رسالة خطأ من آخر جلب فاشل (null = لا خطأ) */
  error: string | null;
  /** جارٍ تنفيذ «تعليم الكل كمقروء» */
  markingAll: boolean;
  /** فشل آخر عملية تعليم (null = لا فشل) */
  markError: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismissMarkError: () => void;
}

/**
 * حالة واحدة مكان كل الحالة. `items === null` تعني «لم يُجلب بعد لهذا الحساب»
 * (وليس «لا إشعارات»)، ومنها يُشتقّ مؤشر التحميل — فلا نحتاج setState داخل
 * effect ورفع رندرات متتالية.
 */
interface NotificationsState {
  /** صاحب هذه الحالة — أي قيمة مختلفة منها تُهمَل بالكامل */
  userId: string | null;
  items: NotificationRow[] | null;
  unreadCount: number;
  error: string | null;
  markError: string | null;
  markingAll: boolean;
  /** جلب بدأه المستخدم (زر/إعادة محاولة) لا الاستطلاع الخفي */
  refreshing: boolean;
}

function emptyState(userId: string | null): NotificationsState {
  return {
    userId,
    items: null,
    unreadCount: 0,
    error: null,
    markError: null,
    markingAll: false,
    refreshing: false,
  };
}

function dedupe(list: NotificationRow[]): NotificationRow[] {
  const seen = new Set<string>();
  return list.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

/**
 * كل منطق حالة الإشعارات في مكان واحد، و`NotificationsProvider` مجرد Context.
 *
 * قبل هذا كان الجرس وصفحة /notifications ينشئان كلٌّ منهما نسخة مستقلة من
 * `useNotifications()`، فأي تعليم إشعار من جهة لا يظهر أثره في الأخرى حتى
 * الاستطلاع التالي (45 ثانية) — أو لا يظهر إطلاقاً عند فشل الجلب.
 *
 * ثلاث حمايات أساسية (كلها تمنع عرض بيانات مستخدم لمتخلٍّ آخر):
 *   1) **ملكية الحالة**: `owns = state.userId === activeUser`، وما لا يخصّ
 *      الحساب الحالي لا يُعرض إطلاقاً.
 *   2) **استبدال كامل عند تبديل الحساب**: لا تصفير للـrefs فقط — بل استبدال
 *      الحالة بـ`emptyState`، وإلا بقيت قائمة المستخدم السابق في `state.items`
 *      ولما صار `owns` صحيحاً بعد فشل جلب الحساب الجديد ظهرت له.
 *   3) **إبطال الطلبات الجارية**: عدّاد نسخة (seq) يزيد عند كل تبديل حساب
 *      أو تسجيل خروج، فلا يكتب ردّ قديم فوق حالة أحدث.
 */
export function useNotificationsStore(): NotificationsContextValue {
  const { user, isLoggedIn } = useSession();
  const activeUser = isLoggedIn && user?.id ? user.id : null;

  const [state, setState] = useState<NotificationsState>(() => emptyState(activeUser));

  // مرايا للحالة تُقرأ داخل الاستدعاءات غير المتزامنة (تفادي الإغلاق stale)
  const itemsRef = useRef<NotificationRow[]>([]);
  const unreadRef = useRef(0);
  // الحساب الذي تنتمي إليه الحالة الحالية — أي رد من غيره يُهمَل
  const userIdRef = useRef<string | null>(activeUser);
  // عدّاد النسخة: كل جلب يزيده، ولا يكتب إلا إن كان الأحدث
  const seqRef = useRef(0);
  // إشعارات Realtime التي وصلت أثناء جلب جارٍ — تُدمج فوق النتيجة
  const pendingRef = useRef<NotificationRow[]>([]);
  const markingAllRef = useRef(false);

  /**
   * لا نكتب ولا نقرأ أي مرآة أثناء الريندر: العزل يتم بحساب «ملكية» الحالة
   * داخل `value` (انظر `owns`) — فأي حالة لا تخصّ الحساب الحالي تُخفى فوراً.
   */
  const commit = useCallback((nextItems: NotificationRow[], nextUnread: number) => {
    itemsRef.current = nextItems;
    unreadRef.current = nextUnread;
    setState((s) => ({ ...s, items: nextItems, unreadCount: nextUnread }));
  }, []);

  /**
   * جلب واحد يخدم الجرس والصفحة معاً.
   *
   * مؤشر التحميل يُدار خارجها (مشتقّ للحالة الأولى، و`refresh` للمسار الصادر
   * عن المستخدم) فلا يحدث رندر متتالٍ من مسار الجلب نفسه.
   */
  const load = useCallback(async (userId: string) => {
    const seq = ++seqRef.current;

    const [listResult, countResult] = await Promise.all([
      getUserNotifications(userId, FETCH_LIMIT),
      getUnreadNotificationsCount(userId),
    ]);

    // رد قديم أو حساب تغيّر أثناء الطلب — نتجاهله تماماً
    if (seq !== seqRef.current || userIdRef.current !== userId) return;

    // إشعارات Realtime التي وصلت أثناء الجلب تُدمج فوق النتيجة بدل استبدالها
    const pending = pendingRef.current;
    pendingRef.current = [];

    if (listResult.error) {
      setState((s) => {
        // الفشل لا يعني تفريغ الشاشة: إن كانت هذه الحالة لنفس الحساب نُبقي
        // آخر قائمة معروفة. لكن إن كانت لحساب آخر (تبديل حساب) فاستبدال كامل
        // بلا وراثة — بلا هذا الشرط كانت قائمة A تُعرض لـ B عند فشل جلب B.
        if (s.userId !== userId) {
          return { ...emptyState(userId), error: listResult.error };
        }
        return { ...s, error: listResult.error, refreshing: false };
      });
      return;
    }

    const merged = dedupe([...pending, ...listResult.data]).slice(0, FETCH_LIMIT);

    // العدّاد: عند فشل طلبه نُبقي آخر قيمة معروفة بدل التصفير المضلّل
    const nextUnread = countResult.error ? unreadRef.current : countResult.data;
    itemsRef.current = merged;
    unreadRef.current = nextUnread;
    setState({
      userId,
      items: merged,
      unreadCount: nextUnread,
      error: countResult.error,
      markError: null,
      markingAll: false,
      refreshing: false,
    });
  }, []);

  /**
   * إعادة محاولة صريحة من المستخدم (زر «إعادة المحاولة») — مسار حدث لا
   * effect، فاستدير مؤشر التحميل هنا لا يُسبّب رندراً متتالياً. الاستطلاع
   * الخفي لا يمرّ من هنا فلا اهتزّ في المؤشر كل 45 ثانية.
   */
  const refresh = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    setState((s) => (s.refreshing ? s : { ...s, refreshing: true }));
    await load(userId);
  }, [load]);

  // إشعار Realtime: يظهر فوراً في كل الواجهات، ويُحفظ للدمج مع أي جلب جارٍ.
  // بلا حساب نشط لا مكان له — وقبل توليده نتحقق أن الرسالة لم تُعرَض بعد.
  useRealtimeNotifications(
    useCallback(
      (row: NotificationRow) => {
        if (!userIdRef.current) return;
        if (itemsRef.current.some((n) => n.id === row.id)) return;
        pendingRef.current = dedupe([row, ...pendingRef.current]).slice(0, BELL_VISIBLE_LIMIT);
        commit([row, ...itemsRef.current].slice(0, FETCH_LIMIT), unreadRef.current + 1);
      },
      [commit],
    ),
  );

  /**
   * تبديل الحساب + الجلب الأولي + الاستطلاع الدوري.
   *
   * الاستبدال الكامل للحالة هنا (وليس تصفير الـrefs فقط) هو ما يمنع تسرّب
   * بيانات المستخدم السابق: بمجرد تغيّر الحساب تصبح `state` فارغة ومنسوبة
   * للحساب الجديد، فلا تُرث أي عنصر قديم. وهو أيضاً ما يجعل إعادة دخول
   * المستخدم نفسه لا تُظهر بياناته القديمة قبل نجاح الجلب الجديد.
   */
  useEffect(() => {
    // إبطال كل رد جارٍ: التبديل وتسجيل الخروج كلاهما يزيد العدّاد
    seqRef.current += 1;
    userIdRef.current = activeUser;
    pendingRef.current = [];
    itemsRef.current = [];
    unreadRef.current = 0;
    markingAllRef.current = false;

    // استبدال كامل (لا وراثة) — رندر إضافي واحد عمداً، ولا يمكن أن يتكرر
    // لأن هذا الـeffect لا يعتمد على أي حالة.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(emptyState(activeUser));

    // تسجيل الخروج: لا جلب ولا استطلاع — الحالة صفرية والملكية محجوبة أصلاً
    if (!activeUser) return;

    // `load` لا يلمس الحالة قبل أول `await` — كل setState يقع بعد رد الشبكة،
    // فلا حلقة رندر (القاعدة لا تتتبّع مواضع await داخل الدالة غير المتزامنة).
    void load(activeUser);

    const timer = setInterval(() => {
      void load(userIdRef.current ?? activeUser);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeUser, load]);

  const markAsRead = useCallback(
    async (id: string) => {
      const userId = userIdRef.current;
      if (!userId) return;

      const target = itemsRef.current.find((n) => n.id === id);
      if (!target || target.read_at) return;

      // لقطة قبل التغيير — أساس الـ rollback
      const snapshotItems = itemsRef.current;
      const snapshotUnread = unreadRef.current;

      // تحديث تفاؤلي فوري
      const optimisticItems = itemsRef.current.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      );
      commit(optimisticItems, Math.max(0, unreadRef.current - 1));

      const result = await markNotificationsRead([id]);

      // إبطال: تبديل الحساب أثناء الطلب
      if (userIdRef.current !== userId) return;

      if (result.error) {
        // rollback: استرجاع الحالة السابقة + إظهار رسالة خطأ
        commit(snapshotItems, snapshotUnread);
        setState((s) => ({ ...s, markError: result.error }));
      }
    },
    [commit],
  );

  const markAllRead = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    // الحارس في ref لا في state: نداءان متتاليان قبل إعادة الريندر
    if (markingAllRef.current) return;
    markingAllRef.current = true;

    const snapshotItems = itemsRef.current;
    const snapshotUnread = unreadRef.current;

    const optimisticItems = itemsRef.current.map((n) =>
      n.read_at ? n : { ...n, read_at: new Date().toISOString() },
    );

    setState((s) => ({ ...s, markingAll: true, markError: null }));
    // تحديث تفاؤلي فوري — القائمة قد لا تحتوي كل الإشعارات، لكن القاعدة
    // هي التي تُحدّد النتيجة النهائية (RPC بلا مدخلات على auth.uid()).
    commit(optimisticItems, 0);

    const result = await markAllNotificationsRead();

    markingAllRef.current = false;
    if (userIdRef.current !== userId) return;
    setState((s) => ({ ...s, markingAll: false }));

    if (result.error) {
      // rollback كامل عند الفشل — لا نُبقي واجهة تُعلن نجاحاً لم يحدث
      commit(snapshotItems, snapshotUnread);
      setState((s) => ({ ...s, markError: result.error }));
    }
    // عند النجاح: القيمة الموثوقة هي 0 لأن القاعدة لم تترك أي غير مقروء.
  }, [commit]);

  return useMemo<NotificationsContextValue>(() => {
    // العزل الحاسم: ما لم تخصّ الحالة الحساب الحالي لا يُعرض إطلاقاً —
    // هذا ما يمنع تسرّب بيانات مستخدم إلى آخر لحظة تبديل أو تسجيل خروج.
    const owns = activeUser !== null && state.userId === activeUser;
    const loaded = owns ? state.items : null;
    return {
      items: loaded ?? [],
      visibleItems: loaded ? loaded.slice(0, BELL_VISIBLE_LIMIT) : [],
      unreadCount: owns ? state.unreadCount : 0,
      // «لم يُجلب بعد لهذا الحساب» أو جلب صادره المستخدم
      loading: activeUser ? !owns || loaded === null || state.refreshing : false,
      error: owns ? state.error : null,
      markingAll: owns ? state.markingAll : false,
      markError: owns ? state.markError : null,
      refresh,
      markAsRead,
      markAllRead,
      dismissMarkError: () => setState((s) => ({ ...s, markError: null })),
    };
  }, [activeUser, state, refresh, markAsRead, markAllRead]);
}