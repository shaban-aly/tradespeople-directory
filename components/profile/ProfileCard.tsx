"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { SessionProfile } from "@/hooks/auth/useSession";
import {
  IconBell,
  IconCheck,
  IconChevronLeft,
  IconShieldCheck,
  IconWrench,
} from "@/components/shared/icons";
import { resizeGoogleAvatar } from "@/lib/utils/image-loader";

interface ProfileCardProps {
  user: User;
  profile: SessionProfile | null;
}

export function ProfileCard({ user, profile }: ProfileCardProps) {
  const [imgError, setImgError] = useState(false);

  const displayName =
    profile?.displayName ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "مستخدم";

  const avatarUrl = profile?.avatarUrl || user.user_metadata?.avatar_url || null;
  const initial = displayName.trim().charAt(0).toUpperCase() || "م";

  const role = profile?.role || "client";
  const roleConfigs = {
    client: {
      label: "عميل موثّق",
      icon: IconCheck,
      badgeClass: "bg-accent/10 text-accent border-accent/25",
    },
    craftsman: {
      label: "فني معتمد",
      icon: IconWrench,
      badgeClass: "bg-action/15 text-action border-action/30",
    },
    admin: {
      label: "مشرف النظام",
      icon: IconShieldCheck,
      badgeClass: "bg-warning/15 text-warning border-warning/30",
    },
  };

  const currentRole = roleConfigs[role] || roleConfigs.client;
  const RoleIcon = currentRole.icon;

  const primaryCta =
    role === "admin"
      ? {
          href: "/admin",
          label: "الانتقال إلى لوحة الإدارة الشاملة",
          icon: <IconShieldCheck className="h-4 w-4" />,
          variant: "warning" as const,
        }
      : role === "craftsman"
      ? {
          href: "/dashboard",
          label: "الانتقال إلى لوحة تحكم الفني",
          icon: <IconWrench className="h-4 w-4" />,
          variant: "action" as const,
        }
      : {
          href: "/my-requests",
          label: "متابعة طلباتي الحالية",
          icon: <IconBell className="h-4 w-4" />,
          variant: "action" as const,
        };

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 sm:p-7 shadow-xs text-center">
      {/* هالة خلفية ناعمة جداً تمنح عمقاً بصرياً فخماً */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-accent/5 blur-3xl dark:bg-accent/10" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-action/5 blur-3xl dark:bg-action/10" />

      <div className="relative flex flex-col items-center">
        {/* الصورة الشخصية الدائرية (نمط Google و Facebook) */}
        <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-full bg-accent text-2xl sm:text-3xl font-black text-on-accent shadow-md overflow-hidden ring-4 ring-background">
          {!imgError && avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resizeGoogleAvatar(avatarUrl, 192)}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{initial}</span>
          )}
        </div>

        {/* الاسم وشارة الدور */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <h1 className="font-heading text-xl sm:text-2xl font-black text-foreground">
            {displayName}
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${currentRole.badgeClass}`}
          >
            <RoleIcon className="h-3.5 w-3.5" />
            {currentRole.label}
          </span>
        </div>

        {/* البريد الإلكتروني وتاريخ التسجيل */}
        <p className="mt-1 text-xs sm:text-sm text-muted font-mono" dir="ltr">
          {user.email}
        </p>

        {joinDate && (
          <p className="mt-1 text-xs text-muted/75">
            عضو مسجل منذ {joinDate}
          </p>
        )}

        {/* زر الإجراء الرئيسي العريض */}
        <div className="mt-5 w-full">
          <Link
            href={primaryCta.href}
            className={`w-full min-h-12 py-3 px-4 flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-xs transition-all active:scale-[0.99] ${
              primaryCta.variant === "warning"
                ? "bg-warning text-on-warning hover:bg-warning/90"
                : "bg-action text-on-action hover:bg-action/90"
            }`}
          >
            {primaryCta.icon}
            <span>{primaryCta.label}</span>
            <IconChevronLeft className="h-4 w-4" />
          </Link>

          {/* مدخل ثانوي للانضمام كفني للعملاء */}
          {role === "client" && (
            <div className="mt-3 text-center">
              <Link
                href="/join"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
              >
                <IconWrench className="h-3.5 w-3.5" />
                <span>هل أنت فني أو صنايعي؟ انضم إلى الدليل</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
