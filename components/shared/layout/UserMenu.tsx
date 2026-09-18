"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/auth/useSession";
import {
  IconActivity,
  IconBookmark,
  IconWrench,
  IconShieldCheck,
  IconLogOut,
  IconChevronLeft,
} from "@/components/shared/icons";

export function UserMenu() {
  const { user, profile, isLoggedIn, isAdmin, isCraftsman, loading, signOut } =
    useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (loading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-border" aria-hidden="true" />
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        id="header-login-link"
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
      >
        دخول
      </Link>
    );
  }

  const displayName =
    profile?.displayName ??
    user?.email ??
    "أنا";
  const initial = String(displayName).charAt(0).toUpperCase();

  const avatarContent = profile?.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={profile.avatarUrl}
      alt={displayName}
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <span>{initial}</span>
  );

  const avatarClass =
    "flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent shadow-sm transition-transform active:scale-95";

  return (
    <div className="relative" ref={menuRef}>
      {/* ── موبايل: رابط ثابت مباشر إلى البروفايل ── */}
      <Link
        id="header-user-profile-link"
        href="/profile"
        data-tour="nav-profile"
        className={`sm:hidden ${avatarClass}`}
        aria-label="صفحة حسابي"
      >
        {avatarContent}
      </Link>

      {/* ── ديسكتوب: زر يفتح القائمة المنسدلة ── */}
      <button
        id="header-user-menu-btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-tour="nav-profile"
        className={`hidden sm:flex ${avatarClass}`}
        aria-label="قائمة المستخدم"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {avatarContent}
      </button>

      {/* ── القائمة المنسدلة (ديسكتوب فقط) ── */}
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-2 w-60 origin-top-left rounded-2xl border border-border bg-card py-1.5 shadow-card overflow-hidden"
        >
          {/* كارت المستخدم — يودي إلى البروفايل */}
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/10 group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent overflow-hidden">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
              <span className="flex items-center gap-1 text-[11px] text-accent font-medium mt-0.5">
                <span>عرض الحساب والإعدادات</span>
                <IconChevronLeft className="h-3 w-3" />
              </span>
            </div>
          </Link>

          {/* روابط الأقسام */}
          <div className="py-1">
            <Link
              href="/activity"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2 text-right text-sm text-foreground transition-colors hover:bg-accent/10"
              onClick={() => setOpen(false)}
            >
              <IconActivity className="h-4 w-4 text-muted" />
              <span>سجل نشاطاتي</span>
            </Link>

            <Link
              href="/favorites"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2 text-right text-sm text-foreground transition-colors hover:bg-accent/10"
              onClick={() => setOpen(false)}
            >
              <IconBookmark className="h-4 w-4 text-muted" />
              <span>المفضلة والمحفوظات</span>
            </Link>

            {isCraftsman && (
              <Link
                href="/dashboard"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2 text-right text-sm font-semibold text-action transition-colors hover:bg-action/10"
                onClick={() => setOpen(false)}
              >
                <IconWrench className="h-4 w-4 text-action" />
                <span>لوحة تحكم الفني</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2 text-right text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
                onClick={() => setOpen(false)}
              >
                <IconShieldCheck className="h-4 w-4 text-accent" />
                <span>لوحة الإدارة</span>
              </Link>
            )}
          </div>

          {/* تسجيل خروج */}
          <div className="border-t border-border pt-1">
            <button
              id="header-signout-btn"
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-right text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10"
            >
              <IconLogOut className="h-4 w-4 text-red-600" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
