// حالة الجولة التعريفية — تُحفظ محلياً في localStorage فقط، دون أي طلب DB.
// المفتاح: "suez:tour". النسخة تحمي من بنى قديمة عند تحديث النظام مستقبلاً.

export const TOUR_STORAGE_KEY = "suez:tour";
export const TOUR_STATE_VERSION = 1 as const;

export interface TourState {
  v: typeof TOUR_STATE_VERSION;
  /** اكتملت الجولة الرئيسية بالكامل (الوصول لآخر خطوة) */
  coreDone: boolean;
  /** أُغلقت الجولة الرئيسية قبل اكتمالها (إغلاق ≠ اكتمال) */
  coreSkipped: boolean;
  /** أول مرة تُعرض فيها جولة الحساب (توقيت ISO) — تُملأ عند المشاهدة */
  accountSeenAt: string | null;
}

export const EMPTY_TOUR_STATE: TourState = {
  v: TOUR_STATE_VERSION,
  coreDone: false,
  coreSkipped: false,
  accountSeenAt: null,
};

export function isTourState(value: unknown): value is TourState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return (
    state.v === TOUR_STATE_VERSION &&
    typeof state.coreDone === "boolean" &&
    typeof state.coreSkipped === "boolean" &&
    (state.accountSeenAt === null || typeof state.accountSeenAt === "string")
  );
}

/** قراءة نص مخزّن وتحويله لحالة صالحة — أي بنية قديمة/تالفة تعود للفارغة. */
export function parseTourState(raw: string | null): TourState {
  if (!raw) return EMPTY_TOUR_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isTourState(parsed) ? parsed : EMPTY_TOUR_STATE;
  } catch {
    return EMPTY_TOUR_STATE;
  }
}

type LikeStorage = Pick<Storage, "getItem" | "setItem">;

export function readTourState(storage: LikeStorage): TourState {
  return parseTourState(storage.getItem(TOUR_STORAGE_KEY));
}

export function writeTourState(storage: LikeStorage, state: TourState): void {
  storage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
}

/** هل الجولة الرئيسية محسومة (اكتمال أو إغلاق)؟ */
export function isCoreResolved(state: TourState): boolean {
  return state.coreDone || state.coreSkipped;
}

/** هل تُفتح الجولة الرئيسية تلقائياً؟ */
export function shouldAutoStartCore(state: TourState): boolean {
  return !state.coreDone && !state.coreSkipped;
}

/** هل تُفتح جولة الحساب تلقائياً؟ (بعد حسم الجولة الرئيسية، ولم تُعرض بعد) */
export function shouldAutoStartAccount(state: TourState): boolean {
  return isCoreResolved(state) && state.accountSeenAt === null;
}

export function withCoreDone(state: TourState): TourState {
  return { ...state, coreDone: true, coreSkipped: false };
}

export function withCoreSkipped(state: TourState): TourState {
  return { ...state, coreSkipped: true };
}

export function withAccountSeen(
  state: TourState,
  now: Date = new Date(),
): TourState {
  return { ...state, accountSeenAt: now.toISOString() };
}