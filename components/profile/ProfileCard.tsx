"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { SessionProfile } from "@/hooks/auth/useSession";
import {
  IconCheck,
  IconWrench,
  IconShieldCheck,
  IconChevronLeft,
} from "@/components/shared/icons";

interface ProfileCardProps {
  user: User;
  profile: SessionProfile | null;
}

export function ProfileCard({ user, profile }: ProfileCardProps) {
  const displayName =
    profile?.displayName ||
    user.email?.split("@")[0] ||
    "مستخدم";

  const avatarUrl = profile?.avatarUrl ?? undefined;
  const initial = displayName.charAt(0).toUpperCase();

  const role = profile?.role || "client";
  const roleConfigs = {
    client: {
      label: "عميل موثّق",
      icon: IconCheck,
      badgeClass: "bg-accent/10 text-accent border-accent/20",
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

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card sm:p-7">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
        {/* الصورة الشخصية */}
        <div className="relative flex h-20 w-20 sm:h-22 sm:w-22 shrink-0 items-center justify-center rounded-2xl bg-accent text-3xl font-extrabold text-on-accent shadow-sm overflow-hidden ring-4 ring-card">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        {/* تفاصيل المستخدم */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
              {displayName}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${currentRole.badgeClass}`}
            >
              <RoleIcon className="h-3.5 w-3.5" />
              {currentRole.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted" dir="ltr">
            {user.email}
          </p>

          <p className="mt-2 text-xs text-muted">
            عضو مسجل بحساب جوجل منذ{" "}
            {new Date(user.created_at).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
            })}
          </p>

          {/* روابط سريعة حسب الدور دون إيموجي */}
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {role === "craftsman" && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-action px-4 py-2 text-xs sm:text-sm font-bold text-on-action shadow-xs transition-colors hover:bg-action/90"
              >
                <IconWrench className="h-4 w-4" />
                لوحة تحكم الفني
                <IconChevronLeft className="h-3.5 w-3.5" />
              </Link>
            )}
            {role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs sm:text-sm font-bold text-on-accent shadow-xs transition-colors hover:bg-accent/90"
              >
                <IconShieldCheck className="h-4 w-4" />
                لوحة تحكم الإدارة
                <IconChevronLeft className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
