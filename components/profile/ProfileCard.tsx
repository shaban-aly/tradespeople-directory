"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { SessionProfile } from "@/hooks/auth/useSession";
import {
  IconCheck,
  IconWrench,
  IconShieldCheck,
  IconStar,
  IconActivity,
  IconChevronLeft,
} from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

interface ProfileCardProps {
  user: User;
  profile: SessionProfile | null;
  favoritesCount?: number;
  reviewsCount?: number;
}

export function ProfileCard({
  user,
  profile,
  favoritesCount = 0,
  reviewsCount = 0,
}: ProfileCardProps) {
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
      badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
  };

  const currentRole = roleConfigs[role] || roleConfigs.client;
  const RoleIcon = currentRole.icon;

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-card">
      {/* هالة خلفية ناعمة */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-accent/10 blur-2xl dark:bg-accent/15" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-action/10 blur-2xl dark:bg-action/15" />

      <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-right">
        {/* الصورة الشخصية الذكية مع حماية من 403 ومنع تشوه alt text */}
        <div className="relative flex h-20 w-20 sm:h-22 sm:w-22 shrink-0 items-center justify-center rounded-2xl bg-accent text-2xl sm:text-3xl font-extrabold text-on-accent shadow-sm overflow-hidden ring-4 ring-card">
          {!imgError && avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{initial}</span>
          )}
        </div>

        {/* تفاصيل المستخدم */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-2.5">
            <h1 className="font-heading text-xl font-extrabold text-foreground sm:text-2xl">
              {displayName}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${currentRole.badgeClass}`}
            >
              <RoleIcon className="h-3.5 w-3.5" />
              {currentRole.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted" dir="ltr">
            {user.email}
          </p>

          {joinDate && (
            <p className="mt-1.5 text-xs text-muted">
              عضو مسجل منذ {joinDate}
            </p>
          )}

          {/* عدادات سريعة للنشاط تمنح البروفايل حيوية وتفاعلية */}
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <Link
              href="/favorites"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-accent hover:text-accent shadow-xs active:scale-98"
            >
              <IconStar className="h-4 w-4 text-amber-500 fill-current" />
              <span>المفضلة: {toArabicDigits(favoritesCount)} فني</span>
              <IconChevronLeft className="h-3 w-3 text-muted" />
            </Link>

            <Link
              href="/activity"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-accent hover:text-accent shadow-xs active:scale-98"
            >
              <IconActivity className="h-4 w-4 text-accent" />
              <span>تقييماتي: {toArabicDigits(reviewsCount)} تقييم</span>
              <IconChevronLeft className="h-3 w-3 text-muted" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
