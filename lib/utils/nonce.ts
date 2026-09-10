/**
 * يولد Nonce عشوائي مشفر ويحسب قيمة الـ SHA-256 Hash الخاصة به
 * مطلوب لتأمين عملية تسجيل الدخول بـ Google One-Tap و Supabase
 */
export async function generateNonce(): Promise<{
  rawNonce: string;
  hashedNonce: string;
}> {
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  const rawNonce = btoa(String.fromCharCode(...randomValues));

  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(rawNonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { rawNonce, hashedNonce };
}
