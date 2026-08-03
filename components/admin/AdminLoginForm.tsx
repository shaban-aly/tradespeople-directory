"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff, IconLock, IconMail } from "@/components/shared/icons";
import { useAdminSession } from "@/hooks/auth/useAdminSession";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { validateEmail, validatePassword } from "@/lib/utils/validation";

const inputClass =
  "w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function AdminLoginForm() {
  const router = useRouter();
  const { user, isAdmin, loading, signIn } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace("/admin");
    }
  }, [loading, user, isAdmin, router]);

  function getEmailError() {
    return emailTouched ? emailError : "";
  }

  function getPasswordError() {
    return passwordTouched ? passwordError : "";
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (emailTouched) setEmailError(validateEmail(value) ?? "");
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (passwordTouched) setPasswordError(validatePassword(value) ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const nextEmailError = validateEmail(email) ?? "";
    const nextPasswordError = validatePassword(password) ?? "";
    setEmailTouched(true);
    setPasswordTouched(true);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) return;

    setSubmitting(true);
    const nextError = await signIn(email, password);
    if (nextError) {
      setError(nextError);
      setSubmitting(false);
      return;
    }
    const nextParam = new URLSearchParams(window.location.search).get("next");
    const nextPath =
      nextParam && nextParam.startsWith("/admin") && nextParam !== "/admin/login"
        ? nextParam
        : "/admin";
    router.replace(nextPath);
  }

  if (loading) {
    return (
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-border" />
        <div className="h-12 animate-pulse rounded-xl bg-border" />
        <div className="h-12 animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-5 rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <Field
        label="البريد الإلكتروني"
        htmlFor="admin-email"
        required
        error={getEmailError()}
      >
        <div className="relative">
          <IconMail className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="admin-email"
            type="email"
            required
            dir="ltr"
            autoComplete="email"
            maxLength={254}
            aria-invalid={Boolean(getEmailError()) || undefined}
            aria-describedby={getEmailError() ? fieldErrorId("admin-email") : undefined}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="admin@example.com"
            className={`${inputClass} ${getEmailError() ? "border-danger" : ""}`}
          />
        </div>
      </Field>

      <Field
        label="كلمة المرور"
        htmlFor="admin-password"
        required
        error={getPasswordError()}
      >
        <div className="relative">
          <IconLock className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            required
            dir="ltr"
            autoComplete="current-password"
            minLength={8}
            maxLength={72}
            aria-invalid={Boolean(getPasswordError()) || undefined}
            aria-describedby={
              getPasswordError() ? fieldErrorId("admin-password") : undefined
            }
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            placeholder="••••••••"
            className={`${inputClass} pl-12 ${getPasswordError() ? "border-danger" : ""}`}
          />
          <button
            type="button"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            onClick={() => setShowPassword((next) => !next)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <IconEyeOff className="h-5 w-5" />
            ) : (
              <IconEye className="h-5 w-5" />
            )}
          </button>
        </div>
      </Field>

      {error && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-base font-bold text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-12 rounded-xl bg-accent px-4 text-lg font-bold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {submitting ? "جاري الدخول..." : "دخول المشرف"}
      </button>
    </form>
  );
}
