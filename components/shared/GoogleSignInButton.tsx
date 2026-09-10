"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabase } from "@/lib/db/client";
import { useTheme } from "@/hooks/ui/useTheme";
import { generateNonce } from "@/lib/utils/nonce";

interface GoogleSignInButtonProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function GoogleSignInButton({ redirectTo = "/", onSuccess }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rawNonceRef = useRef<string | null>(null);
  const { theme } = useTheme();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    let isMounted = true;

    async function handleCredentialResponse(response: { credential?: string }) {
      if (!response.credential) return;
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabase();
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
          nonce: rawNonceRef.current ?? undefined,
        });

        if (signInError) {
          if (isMounted) {
            setError(signInError.message || "حدث خطأ أثناء تسجيل الدخول");
            setLoading(false);
          }
          return;
        }

        // نجاح تسجيل الدخول
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = redirectTo;
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
          setLoading(false);
        }
      }
    }

    async function initGsi() {
      if (!window.google?.accounts?.id || !containerRef.current) return;

      const { rawNonce, hashedNonce } = await generateNonce();
      rawNonceRef.current = rawNonce;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        context: "signin",
        ux_mode: "popup",
        use_fedcm_for_prompt: true,
        nonce: hashedNonce,
      });

      // مسح المحتوى القديم للـ container وإعادة رسم الزر
      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: theme === "dark" ? "filled_black" : "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 320,
        locale: "ar",
      });
    }

    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript && window.google?.accounts?.id) {
      initGsi();
    } else if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, [clientId, theme, redirectTo]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-sm text-amber-700">
        يرجى إضافة <code className="font-mono font-bold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> في ملف{" "}
        <code className="font-mono font-bold">.env.local</code> لتفعيل تسجيل الدخول المباشر.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {loading ? (
        <div className="flex h-12 w-full max-w-[320px] items-center justify-center gap-2 rounded-xl border border-border bg-card text-muted shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm font-medium">جاري تسجيل الدخول...</span>
        </div>
      ) : (
        <div ref={containerRef} className="flex min-h-12 w-full justify-center" />
      )}

      {error && (
        <p className="text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
