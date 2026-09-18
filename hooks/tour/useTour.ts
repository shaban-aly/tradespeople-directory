"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/hooks/auth/useSession";
import {
  DETAILS_STEPS_START_INDEX,
  TOURS,
  resolveStepTarget,
  stepAllowsPathname,
  type TourId,
  type TourStep,
} from "@/lib/tour/steps";
import {
  readTourState,
  writeTourState,
  withAccountSeen,
  withCoreDone,
  withCoreSkipped,
  shouldAutoStartAccount,
  shouldAutoStartCore,
} from "@/lib/tour/state";
import {
  findFirstCardLink,
  findTourElement,
  getElementRadius,
  getElementRect,
  isElementInViewport,
  rectsEqual,
  scrollElementIntoView,
  TOUR_WAIT_INTERVAL,
  TOUR_WAIT_TIMEOUT,
  type ElementRect,
} from "@/lib/tour/dom";
import {
  BOTTOM_BAR_HEIGHT,
  HEADER_HEIGHT,
  STICKY_CALL_HEIGHT,
  type KeepOutZone,
} from "@/lib/tour/placement";

export type TourStatus = "idle" | "active" | "navigating" | "closing";

/** قياس الهدف مربوط بمعرّف الخطوة (يعزل القياسات القديمة عند تغيير الخطوة) مع نصف قطر الزوايا. */
export type TourTarget = { step: string; rect: ElementRect; radius: number };

/** حدث تشغيل الجولة يدوياً من أي مكان (بطاقة "جولة تعريفية" في البروفايل). */
export const TOUR_START_EVENT = "suez:start-tour";

/** خطوة البحث الوحيدة تُتحقق من افتتاح نافذة البحث عبر أحداثها بدل افتراض نجاح النقرة. */
const SEARCH_STEP_IDS = new Set(["hero-search"]);

/** أحداث نافذة البحث (من hooks/search/useSearchModal) — تُستخدم للتحقق دون تعديل منطق البحث. */
const SEARCH_OPEN_EVENT = "suez:open-search";
const SEARCH_CLOSE_EVENT = "suez:close-search";

/** وحدة التحكم في الجولة: الحالة، التنقل، الانتقال بين الصفحات، الانتظار على العناصر. */
export function useTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, loading: sessionLoading } = useSession();

  const [tour, setTour] = useState<TourId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<TourStatus>("idle");
  const [target, setTarget] = useState<TourTarget | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const tourRef = useRef<TourId | null>(null);
  const statusRef = useRef<TourStatus>("idle");
  const stepIndexRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);
  const targetRef = useRef<TourTarget | null>(null);
  const navTargetRef = useRef<"home" | "details" | "new-tour" | null>(null);
  const navTourRef = useRef<TourId | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const prevPathnameRef = useRef<string | null>(null);
  const manualHandledRef = useRef(false);
  const searchOpenRef = useRef(false);
  const pendingSearchStepRef = useRef<string | null>(null);

  useEffect(() => {
    tourRef.current = tour;
  }, [tour]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);
  useEffect(() => {
    activeIdRef.current = tour && status === "active" ? TOURS[tour][stepIndex]?.id ?? null : null;
  }, [tour, status, stepIndex]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    if (status !== "active" || !tour) return;
    searchOpenRef.current = false;
    pendingSearchStepRef.current = null;
  }, [tour, stepIndex, status]);

  // كشف الموبايل بنفس كسر sm في Tailwind (640px) — بطريقة آمنة للـ hydration.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const requestClose = useCallback(() => {
    setStatus("closing");
    window.setTimeout(() => {
      setTour(null);
      setStepIndex(0);
      setTarget(null);
      setStatus("idle");
      const focusEl = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (focusEl && typeof focusEl.focus === "function") {
        focusEl.focus();
      }
    }, 160);
  }, []);

  const completeTour = useCallback(() => {
    if (!tourRef.current || statusRef.current !== "active") return;
    const storage = window.localStorage;
    const state = readTourState(storage);
    const next =
      tourRef.current === "core"
        ? withCoreDone(state)
        : withAccountSeen(state);
    writeTourState(storage, next);
    requestClose();
  }, [requestClose]);

  const closeTour = useCallback(() => {
    const tourNow = tourRef.current;
    const statusNow = statusRef.current;
    if (!tourNow || statusNow === "idle" || statusNow === "closing") return;
    if (statusNow === "active") {
      const storage = window.localStorage;
      const state = readTourState(storage);
      if (tourNow === "core") {
        if (!state.coreDone) {
          writeTourState(storage, withCoreSkipped(state));
        }
      } else if (state.accountSeenAt === null) {
        // غلق جولة الحساب «شوهدت» — لا نلاحق المستخدم في كل زيارة للرئيسية
        writeTourState(storage, withAccountSeen(state));
      }
    }
    requestClose();
  }, [requestClose]);

  const openTour = useCallback((type: TourId) => {
    restoreFocusRef.current =
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setTour(type);
    setStepIndex(0);
    setStatus("active");
  }, []);

  const startTour = useCallback(
    (type: TourId = "core") => {
      if (statusRef.current !== "idle") return;
      navTourRef.current = type;
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "/";
      if (currentPath !== "/") {
        navTargetRef.current = "new-tour";
        setStatus("navigating");
        router.push("/");
        return;
      }
      openTour(type);
    },
    [openTour, router],
  );

  const nextStep = useCallback(() => {
    const tourNow = tourRef.current;
    if (!tourNow || statusRef.current !== "active") return;
    const steps = TOURS[tourNow];
    const index = stepIndexRef.current;
    const step = steps[index];
    if (!step) return;
    if (index >= steps.length - 1) {
      completeTour();
      return;
    }
    if (step.transition) {
      const href = findFirstCardLink();
      if (href) {
        navTargetRef.current = "details";
        setStatus("navigating");
        router.push(href);
        return;
      }
      // لا يوجد كارت في الصفحة — نتجاوز خطوة الانتقال بأمان
      setStepIndex(index + 1);
      return;
    }
    setStepIndex(index + 1);
  }, [completeTour, router]);

  const prevStep = useCallback(() => {
    const tourNow = tourRef.current;
    if (!tourNow || statusRef.current !== "active") return;
    const index = stepIndexRef.current;
    if (index <= 0) return;
    const previous = TOURS[tourNow][index - 1];
    // العودة عبر خطوة الانتقال تُعيد المستخدم للصفحة الرئيسية عند خطوة "خلينا نشوف"
    if (previous?.transition) {
      navTargetRef.current = "home";
      setStepIndex(index - 1);
      setStatus("navigating");
      router.push("/");
      return;
    }
    setStepIndex(index - 1);
  }, [router]);

  const activeStep = useMemo<TourStep | null>(
    () => (tour && status === "active" ? TOURS[tour][stepIndex] : null),
    [tour, status, stepIndex],
  );

  // انتظار/قياس المستهدف مع إعادة قياس مستمرة (تلتقط أي تغيّر layout مثل scroll أو Reveal)،
  // وتجاوز الخطوة عند انتهاء المهلة، وربط تفاعل الخطوة بالعنصر الحقيقي.
  useEffect(() => {
    if (!activeStep || status !== "active") return;
    const selector = resolveStepTarget(activeStep, isMobile);
    const stepId = activeStep.id;
    if (!selector) return;

    const interaction = activeStep.interaction ?? "info";
    const isSearchStep = SEARCH_STEP_IDS.has(stepId);

    let cancelled = false;
    let interval = 0;
    let currentEl: HTMLElement | null = null;
    let lastRect: ElementRect | null = null;
    let delayedAdvance = 0;
    let elapsed = 0;

    const clearDelayed = () => {
      if (delayedAdvance) {
        window.clearTimeout(delayedAdvance);
        delayedAdvance = 0;
      }
    };

    const onClickTarget = () => {
      if (stepId !== activeIdRef.current || statusRef.current !== "active") return;
      if (isSearchStep) {
        // ننتظر حدث افتتاح نافذة البحث للتحقق — لا نفترض نجاح النقرة
        if (searchOpenRef.current) {
          nextStep();
        } else {
          pendingSearchStepRef.current = stepId;
        }
        return;
      }
      // أزرار تفاعلية (مفضلة/اتصال/جرس): التقدم بعد انتهاء handler الحقيقي للعنصر
      clearDelayed();
      delayedAdvance = window.setTimeout(() => {
        delayedAdvance = 0;
        if (stepId === activeIdRef.current && statusRef.current === "active") {
          nextStep();
        }
      }, 60);
    };

    const settle = () => {
      if (cancelled) return;
      cleanup();
      if (activeStep.optional) {
        nextStep();
      } else {
        closeTour();
      }
    };

    const cleanup = () => {
      cancelled = true;
      window.clearInterval(interval);
      clearDelayed();
      if (currentEl && interaction === "click-target") {
        currentEl.removeEventListener("click", onClickTarget, true);
      }
      currentEl = null;
    };

    const tick = () => {
      if (cancelled) return;
      const el = findTourElement(selector);
      if (!el) {
        lastRect = null;
        if (targetRef.current?.step === stepId) {
          setTarget(null);
        }
        elapsed += TOUR_WAIT_INTERVAL;
        if (elapsed >= TOUR_WAIT_TIMEOUT) {
          window.clearInterval(interval);
          settle();
        }
        return;
      }
      const fresh = el !== currentEl;
      if (fresh) {
        // العنصر ظهر أو أُعيد بناؤه (Reveal/Suspense/auth) — نعيد الربط ونمرر إليه عند الحاجة
        if (currentEl && interaction === "click-target") {
          currentEl.removeEventListener("click", onClickTarget, true);
        }
        currentEl = el;
        if (interaction === "click-target") {
          el.addEventListener("click", onClickTarget, true);
        }
        if (!activeStep.skipScroll && !isElementInViewport(getElementRect(el))) {
          scrollElementIntoView(el);
        }
      }
      const rect = getElementRect(el);
      if (!lastRect || !rectsEqual(rect, lastRect)) {
        lastRect = rect;
        setTarget({ step: stepId, rect, radius: getElementRadius(el) });
      }
      elapsed = 0;
    };

    interval = window.setInterval(tick, TOUR_WAIT_INTERVAL);
    tick();
    return cleanup;
  }, [activeStep, isMobile, status, nextStep, closeTour]);

  // التحقق الفعلي من فتح نافذة البحث: نستمع لأحداثها فنتقدم عند الافتتاح ولا ننكسر عند الإغلاق.
  useEffect(() => {
    if (!tour || status !== "active") return;
    const onOpen = () => {
      searchOpenRef.current = true;
      const pending = pendingSearchStepRef.current;
      if (pending && pending === activeIdRef.current && statusRef.current === "active") {
        pendingSearchStepRef.current = null;
        nextStep();
      }
    };
    const onClose = () => {
      searchOpenRef.current = false;
    };
    window.addEventListener(SEARCH_OPEN_EVENT, onOpen);
    window.addEventListener(SEARCH_CLOSE_EVENT, onClose);
    return () => {
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpen);
      window.removeEventListener(SEARCH_CLOSE_EVENT, onClose);
    };
  }, [tour, status, nextStep]);

  // حل وصول الصفحة أثناء التنقل البرمجي بين الصفحات
  useEffect(() => {
    if (statusRef.current !== "navigating") return;
    const nav = navTargetRef.current;
    if (nav === "details" && pathname.startsWith("/craftsman/")) {
      navTargetRef.current = null;
      setStepIndex((i) => i + 1);
      setStatus("active");
    } else if (nav === "home" && pathname === "/") {
      navTargetRef.current = null;
      setStatus("active");
    } else if (nav === "new-tour" && pathname === "/") {
      const type = navTourRef.current ?? "core";
      navTargetRef.current = null;
      openTour(type);
    }
  }, [pathname, openTour]);

  // رصد خروج المستخدم عن مسار الجولة: ضغطة يدوية على كارت تنتقل لخطوات التفاصيل،
  // وأي مسار آخر خارج الجولة = إغلاق آمن.
  useEffect(() => {
    if (statusRef.current !== "active" || !tourRef.current) return;
    const t = tourRef.current;
    const idx = stepIndexRef.current;
    if (t === "core" && idx < DETAILS_STEPS_START_INDEX && pathname.startsWith("/craftsman/")) {
      // المستخدم فتح صفحة صنايعي بنفسه (خطوة manual) — نقفز لخطوات التفاصيل
      setTarget(null);
      setStepIndex(DETAILS_STEPS_START_INDEX);
      return;
    }
    if (!stepAllowsPathname(t, idx, pathname)) {
      closeTour();
    }
  }, [pathname, closeTour]);

  // مناطق keep-out للكارت (الهيدر الثابت + الشريط السفلي وشريط الاتصال في الموبايل)
  const keepOut = useMemo<KeepOutZone>(() => {
    if (typeof window === "undefined") {
      return { top: 0, bottom: 0 };
    }
    const withoutChrome =
      !pathname.startsWith("/admin") &&
      pathname !== "/login" &&
      pathname !== "/register" &&
      pathname !== "/auth/callback" &&
      pathname !== "/auth/forgot-password";
    let bottom = 0;
    const top = withoutChrome ? HEADER_HEIGHT : 0;
    if (isMobile && withoutChrome) {
      bottom += BOTTOM_BAR_HEIGHT;
      if (pathname.startsWith("/craftsman/")) {
        bottom += STICKY_CALL_HEIGHT;
      }
    }
    return { top, bottom };
  }, [isMobile, pathname]);

  // التشغيل التلقائي: الرئيسية أول زيارة ثم الحساب بعد حسم الرئيسية
  useEffect(() => {
    if (sessionLoading) return;
    const currentPath = pathname ?? "/";
    const storage = window.localStorage;
    const state = readTourState(storage);

    if (statusRef.current === "idle" && !tourRef.current) {
      const wantsManual =
        !manualHandledRef.current &&
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("tour") === "start";
      if (wantsManual) {
        manualHandledRef.current = true;
        startTour("core");
      } else if (currentPath === "/" && prevPathnameRef.current !== "/") {
        if (shouldAutoStartCore(state)) {
          // بدء الجولة رداً على دورة المسار/الجلسة (مزامنة مع مخزن خارجي) — مقصود عمداً
          // eslint-disable-next-line react-hooks/set-state-in-effect
          startTour("core");
        } else if (isLoggedIn && shouldAutoStartAccount(state)) {
          startTour("account");
        }
      }
    }

    prevPathnameRef.current = currentPath;
  }, [pathname, sessionLoading, isLoggedIn, startTour]);

  // التشغيل اليدوي من بطاقة البروفايل أو أي مكان
  useEffect(() => {
    const onStart = () => startTour("core");
    window.addEventListener(TOUR_START_EVENT, onStart);
    return () => window.removeEventListener(TOUR_START_EVENT, onStart);
  }, [startTour]);

  // إغلاق بزرار Escape
  useEffect(() => {
    if (!tour || status === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tour, status, closeTour]);

  return {
    tour,
    step: activeStep,
    stepIndex,
    total: tour ? TOURS[tour].length : 0,
    status,
    isMobile,
    target,
    keepOut,
    isFirst: stepIndex === 0,
    isLast: Boolean(tour) && stepIndex === TOURS[tour as TourId].length - 1,
    next: nextStep,
    prev: prevStep,
    close: closeTour,
    start: startTour,
  };
}