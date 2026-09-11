"use client";

import { useEffect, useRef } from "react";
import { createSupabase } from "@/lib/db/client";
import { useSession } from "@/hooks/auth/useSession";
import { generateNonce } from "@/lib/utils/nonce";

interface UseGoogleOneTapOptions {
  redirectTo?: string;
  disabled?: boolean;
}

export function useGoogleOneTap(options: UseGoogleOneTapOptions = {}) {
  const { redirectTo, disabled = false } = options;
  const { isLoggedIn, loading: sessionLoading } = useSession();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const initializedRef = useRef(false);
  const rawNonceRef = useRef<string | null>(null);

  useEffect(() => {
    // لا تُظهر One Tap إذا كان معطلاً، أو المستخدم مسجل دخوله بالفعل، أو جاري تحميل الجلسة، أو لا يوجد Client ID
    if (disabled || sessionLoading || isLoggedIn || !clientId) {
      return;
    }

    if (initializedRef.current) return;

    let isMounted = true;

    async function handleCredentialResponse(response: { credential?: string }) {
      if (!response.credential) return;

      try {
        console.log("Google One-Tap token received, signing in with Supabase...");
        const supabase = createSupabase();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
          nonce: rawNonceRef.current ?? undefined,
        });

        if (error) {
          console.error("Supabase One-Tap sign-in error:", error);
          alert("خطأ في تسجيل الدخول عبر Supabase: " + error.message);
          return;
        }

        console.log("Supabase One-Tap sign-in success:", data);
        // تسجيل دخول ناجح — إعادة تحميل الصفحة أو الانتقال
        if (redirectTo) {
          window.location.href = redirectTo;
        } else {
          window.location.reload();
        }
      } catch (err) {
        console.error("Unexpected One-Tap error:", err);
      }
    }

    async function triggerPrompt() {
      if (!window.google?.accounts?.id || !isMounted) return;

      let rawNonce: string;
      let hashedNonce: string;
      try {
        // توليد الـ nonce وحسابه
        const nonce = await generateNonce();
        rawNonce = nonce.rawNonce;
        hashedNonce = nonce.hashedNonce;
      } catch (err) {
        // عدم توفّر `crypto.subtle`/بيئة غير آمنة — لا نعطّل الصفحة، فقط نتخطى One-Tap
        console.error("Nonce generation failed, skipping One-Tap:", err);
        return;
      }
      rawNonceRef.current = rawNonce;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        itp_support: true,
        use_fedcm_for_prompt: true,
        nonce: hashedNonce,
      });

      initializedRef.current = true;

      // استدعاء prompt بدون الدوال القديمة لتفادي تحذير FedCM
      window.google.accounts.id.prompt();
    }

    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript && window.google?.accounts?.id) {
      triggerPrompt();
    } else if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) triggerPrompt();
      };
      document.body.appendChild(script);
    } else {
      // السكريبت موجود لكن جاري تحميله
      existingScript.addEventListener("load", () => {
        if (isMounted) triggerPrompt();
      });
    }

    return () => {
      isMounted = false;
      if (window.google?.accounts?.id && initializedRef.current) {
        window.google.accounts.id.cancel();
      }
    };
  }, [disabled, sessionLoading, isLoggedIn, clientId, redirectTo]);
}
