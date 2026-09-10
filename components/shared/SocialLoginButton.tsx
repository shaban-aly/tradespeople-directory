"use client";

import { useState } from "react";
import { createSupabase } from "@/lib/db/client";

type Provider = "google" | "facebook";

const PROVIDER_CONFIG: Record<
  Provider,
  { label: string; color: string; icon: React.ReactNode }
> = {
  google: {
    label: "المتابعة بـ Google",
    color:
      "bg-white text-[#3c4043] border border-border hover:bg-gray-50 dark:bg-[#2d2d2d] dark:text-foreground dark:hover:bg-[#383838]",
    icon: (
      <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M47.532 24.552c0-1.636-.143-3.2-.412-4.695H24v9.01h13.18c-.582 3.04-2.32 5.617-4.938 7.345v6.105h7.988c4.672-4.303 7.302-10.645 7.302-17.765z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.918-2.148 15.89-5.818l-7.988-6.105c-2.153 1.44-4.906 2.29-7.902 2.29-6.077 0-11.22-4.104-13.065-9.617H2.68v6.3C6.636 42.68 14.748 48 24 48z"
        />
        <path
          fill="#FBBC05"
          d="M10.935 28.75A14.87 14.87 0 0 1 10.142 24c0-1.655.285-3.265.793-4.75v-6.3H2.68A23.985 23.985 0 0 0 0 24c0 3.888.925 7.562 2.68 10.85l8.255-6.1z"
        />
        <path
          fill="#EA4335"
          d="M24 9.535c3.42 0 6.49 1.176 8.907 3.484l6.683-6.683C35.91 2.535 30.484 0 24 0 14.748 0 6.636 5.32 2.68 13.15l8.255 6.1C12.78 13.639 17.923 9.535 24 9.535z"
        />
      </svg>
    ),
  },
  facebook: {
    label: "المتابعة بـ Facebook",
    color:
      "bg-[#1877F2] text-white hover:bg-[#166FE5] dark:bg-[#1877F2] dark:hover:bg-[#166FE5]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden="true">
        <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.031 4.388 11.03 10.125 11.927v-8.434H7.078v-3.493h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.493h-2.796v8.434C19.612 23.103 24 18.104 24 12.073z" />
      </svg>
    ),
  },
};

interface SocialLoginButtonProps {
  provider: Provider;
  redirectTo?: string;
}

export function SocialLoginButton({
  provider,
  redirectTo = "/",
}: SocialLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const config = PROVIDER_CONFIG[provider];

  async function handleClick() {
    setLoading(true);
    const origin = window.location.origin;
    await createSupabase().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        queryParams:
          provider === "facebook" ? { display: "popup" } : undefined,
        skipBrowserRedirect: false,
      },
    });
    // الصفحة ستنتقل للـ OAuth — نبقى على loading حتى الانتقال
  }

  return (
    <button
      id={`social-login-${provider}`}
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`
        flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5
        text-base font-semibold shadow-sm transition-all duration-200
        min-h-12 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
        ${config.color}
      `}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        config.icon
      )}
      {config.label}
    </button>
  );
}
