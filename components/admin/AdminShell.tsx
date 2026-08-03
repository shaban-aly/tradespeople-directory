"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_NAV_ITEMS, AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { IconLogOut, IconMenu, IconX } from "@/components/shared/icons";
import { ThemeToggle } from "@/components/shared/ui/ThemeToggle";
import { useAdminSession } from "@/hooks/auth/useAdminSession";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";

function Brand() {
  return (
    <Link href="/admin" className="block rounded-xl px-3 py-2">
      <span className="block font-heading text-xl font-extrabold text-foreground">
        دليل الصنايعية
      </span>
      <span className="text-sm font-bold text-muted">لوحة التحكم</span>
    </Link>
  );
}

function AdminSidebar({
  onSignOut,
  email,
}: {
  onSignOut: () => void;
  email?: string;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Brand />
      <AdminNav />
      <div className="mt-auto grid gap-3 border-t border-border pt-4">
        <div className="grid gap-1">
          <p className="text-base font-bold text-foreground">المشرف</p>
          <p className="text-sm text-muted" dir="ltr">
            {email}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:border-danger/50 hover:text-danger"
        >
          <IconLogOut className="h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, loading, signOut } = useAdminSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  useBodyScrollLock(drawerOpen);

  const openDrawer = useCallback(() => {
    setDrawerClosing(false);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerClosing(true);
    window.setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
    }, 300);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    const drawerTimer = window.setTimeout(() => {
      setDrawerClosing(false);
      setDrawerOpen(false);
    }, 0);
    return () => window.clearTimeout(drawerTimer);
  }, [pathname]);

  const currentTitle =
    ADMIN_NAV_ITEMS.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/admin" && pathname.startsWith(item.href)),
    )?.label ?? "لوحة التحكم";

  async function handleSignOut() {
    await signOut();
    router.replace("/admin/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="grid w-full max-w-sm gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="h-6 w-2/3 animate-pulse rounded-lg bg-border" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-border" />
          <div className="h-12 animate-pulse rounded-xl bg-border" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="grid w-full max-w-sm gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="text-base font-bold text-accent">
            الحساب الحالي مسجل دخول لكنه ليس مشرفاً.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="min-h-12 rounded-xl bg-accent px-4 text-base font-bold text-on-accent"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-border bg-card lg:flex">
          <AdminSidebar onSignOut={() => void handleSignOut()} email={user.email} />
        </aside>

        {drawerOpen && (
          <div
            className={`fixed inset-0 z-50 lg:hidden ${
              drawerClosing ? "pointer-events-none" : ""
            }`}
          >
            <button
              type="button"
              aria-label="إغلاق القائمة"
              onClick={closeDrawer}
              className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
                drawerClosing ? "opacity-0" : "opacity-100"
              }`}
            />
            <aside
              className={`absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-e border-border bg-card shadow-card transition-transform duration-300 ease-out ${
                drawerClosing ? "translate-x-full" : "translate-x-0"
              }`}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <Brand />
                <button
                  type="button"
                  aria-label="إغلاق القائمة"
                  onClick={closeDrawer}
                  className="rounded-lg p-2 text-muted hover:text-foreground"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebar onSignOut={() => void handleSignOut()} email={user.email} />
              </div>
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="فتح القائمة"
                onClick={openDrawer}
                className="rounded-lg border border-border p-2 text-foreground lg:hidden"
              >
                <IconMenu className="h-5 w-5" />
              </button>
              <span className="font-heading text-lg font-extrabold text-foreground">
                {currentTitle}
              </span>
            </div>
            <ThemeToggle />
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
