export interface PushFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

const KEYS: Array<keyof PushFirebaseConfig> = [
  "apiKey",
  "authDomain",
  "projectId",
  "messagingSenderId",
  "appId",
  "vapidKey",
];

/**
 * قراءة إعدادات Firebase Web من متغيرات البيئة العامة (NEXT_PUBLIC_*).
 * تعيد null إن كان أي حقل فارغاً — لا كشف جزئي/كسري للتكوين.
 * دالة نقية قابلة للاختبار في vitest.
 */
export function firebaseConfig(): PushFirebaseConfig | null {
  const cfg: PushFirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "",
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() ?? "",
  };
  if (!KEYS.every((k) => cfg[k].length > 0)) {
    return null;
  }
  return cfg;
}

/** معرف التطبيق الثابت داخل firebase.initializeApp — يمنع تكرار الحالات */
export const PUSH_APP_NAME = "push-notifier";