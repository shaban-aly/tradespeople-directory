// المنطق النقي لـ Edge Function send-push — بلا اعتماديات Deno، وبذلك تُختبر عبر vitest
// كل الدوال هنا معيارية (Web Crypto / TextEncoder) بحيث تعمل في Deno وفي Node.

export interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri: string;
}

export interface FcmMessage {
  message: {
    token: string;
    /** data-only payload — لا notification كائن عمداً لمنع العرض التلقائي من Firebase SDK */
    data: Record<string, string>;
  };
}

export function toBase64Url(input: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < input.length; i += 1) {
    bin += String.fromCharCode(input[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** تحليل ملف خدمة FCM (JSON) والتحقق من الحقول الحرجة */
export function assertServiceAccount(raw: string): ServiceAccount {
  const j = JSON.parse(raw) as Record<string, unknown>;
  const acc: ServiceAccount = {
    project_id: String(j.project_id ?? ""),
    client_email: String(j.client_email ?? ""),
    private_key: String(j.private_key ?? ""),
    token_uri: String(j.token_uri ?? "https://oauth2.googleapis.com/token"),
  };
  if (!acc.project_id || !acc.client_email || !acc.private_key) {
    throw new Error("FCM service account: missing project_id/client_email/private_key");
  }
  return acc;
}

/** فك مفتاح PEM إلى كتلة DER أولية (قابلة للاستيراد عبر WebCrypto) */
export function decodePem(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** توقيع ادعاءات JWT (RS256) عبر WebCrypto — يستخدم لطلب OAuth access token من FCM */
export async function signJwt(
  claims: Record<string, unknown>,
  privateKeyPem: string,
  clientEmail: string,
  nowSec: number,
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: nowSec,
    exp: nowSec + 3600,
    ...claims,
  };
  const enc = new TextEncoder();
  const signingInput =
    toBase64Url(enc.encode(JSON.stringify(header))) +
    "." +
    toBase64Url(enc.encode(JSON.stringify(payload)));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    decodePem(privateKeyPem).buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(signingInput),
  );
  return signingInput + "." + toBase64Url(new Uint8Array(signature));
}

export function buildFcmMessage(
  token: string,
  title: string,
  body: string,
  linkUrl?: string,
  notificationId?: string,
): FcmMessage {
  // data-only payload: Firebase SDK لن يعرض الإشعار تلقائياً.
  // العرض الوحيد يتم عبر self.registration.showNotification() في onBackgroundMessage.
  const data: Record<string, string> = {
    title,
    body,
    link: linkUrl ?? "",
  };
  if (notificationId) {
    data.notification_id = notificationId;
  }
  return { message: { token, data } };
}

export function fcmSendEndpoint(projectId: string): string {
  return `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`;
}

/** وصف موحّد لأخطاء التوكن المعطّلة — تُحذف من القاعدة حينها */
export function isUnregisteredStatus(status: number): boolean {
  return status === 404 || status === 410;
}

export type LinkResolver = (metadata: Record<string, unknown>) => string | undefined;

export const MAX_INTERNAL_LINK_LENGTH = 500;

/**
 * نفس قاعدة `public.is_safe_internal_link` (migration
 * `20261004072423_notification_internal_link_guard.sql`) ونفس
 * `lib/utils/internalLink.ts` — ثلاث نسخ متطابقة عن قصد: القاعدة تمنع التخزين،
 * والخادم يمنع الإرسال، والواجهة تمنع العرض.
 */
export function isSafeInternalLink(link: unknown): link is string {
  if (typeof link !== "string") return false;
  if (link.length < 1 || link.length > MAX_INTERNAL_LINK_LENGTH) return false;
  if (!link.startsWith("/")) return false;
  if (link.startsWith("//")) return false;
  // محارف تحكّم / مسافات / backslash
  if (/[\u0000-\u001f\u007f\s\\]/.test(link)) return false;
  const path = link.split("?")[0].split("#")[0];
  if (path.includes(":")) return false;
  return true;
}

/**
 * وجهة نقرة الإشعار كـ**مسار داخلي نسبي** (مثال `/craftsman/x`).
 *
 * النسبي مقصود لا المطلق: المضيف الذي يفتحه المستخدم هو نفسه الذي يبنيه
 * Service Worker (`self.location.origin`) والواجهة (`window.location.origin`).
 * أي رابط مطلق كان يستمد المضيف من `PUSH_SITE_URL`، فلو اختلف ذلك السر عن
 * مضيف الجهاز الحقيقي (نطاق بديل / www / host آخر) كان `normalizeInternalLink`
 * يرفضه ويفتح التنبيه مساراً فارغاً. النسبي يزيل هذا السر من المعادلة.
 *
 * الأمان: لا تخرج القيمة إلا من مسار موثوق — `metadata.link` المختبر أصلاً
 * بـ`isSafeInternalLink`، أو slug مبني داخلياً، أو `/notifications`.
 */
export const defaultLinkResolver: LinkResolver = (metadata) => {
  const directLink = metadata.link;
  const slug = metadata.slug;

  if (isSafeInternalLink(directLink)) return directLink;
  if (typeof slug === "string" && slug.trim().length > 0) {
    return `/craftsman/${encodeURIComponent(slug.trim())}`;
  }
  return "/notifications";
};