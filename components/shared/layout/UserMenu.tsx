"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/auth/useSession";
import { ButtonAnchor } from "@/components/shared/ui/Button";

export function UserMenu() {
  const { user, isLoggedIn, isAdmin, isCraftsman, loading, signOut } = useSession();
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

  // الأفاتار: أول حرف من الاسم أو البريد
  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "أنا";
  const initial = String(displayName).charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="header-user-menu-btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent shadow-sm transition-transform active:scale-95"
        aria-label="قائمة المستخدم"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user?.user_metadata?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.user_metadata.avatar_url as string}
            alt={displayName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-2 w-52 origin-top-left rounded-xl border border-border bg-card py-1 shadow-card"
        >
          {/* اسم المستخدم */}
          <div className="border-b border-border px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>

          {/* روابط حسب الدور */}
          {isCraftsman && (
            <Link
              href="/dashboard"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-foreground transition-colors hover:bg-accent/10"
              onClick={() => setOpen(false)}
            >
              لوحة تحكمي
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-foreground transition-colors hover:bg-accent/10"
              onClick={() => setOpen(false)}
            >
              لوحة الإدارة
            </Link>
          )}
          <Link
            href="/favorites"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-foreground transition-colors hover:bg-accent/10"
            onClick={() => setOpen(false)}
          >
            مفضّلتي
          </Link>

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
              className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-danger transition-colors hover:bg-danger/10"
            >
              تسجيل خروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
