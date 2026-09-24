"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAdminNavTitle } from "@/components/admin/AdminNav";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminDrawer } from "@/components/admin/AdminDrawer";
import { TopbarAttentionChip } from "@/components/admin/overview/TopbarAttentionChip";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { useAdminNavCounts } from "@/hooks/admin/useAdminNavCounts";
import { useAdminSidebar } from "@/hooks/admin/useAdminSidebar";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { NotificationsToast } from "@/components/shared/ui/NotificationsToast";
import { IconMenu } from "@/components/shared/icons";
import { ThemeToggle } from "@/components/shared/ui/ThemeToggle";
import { useSession } from "@/hooks/auth/useSession";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";
import type { AdminNavCounts } from "@/lib/db/admin";

export function AdminShell({
  children,
  userEmail,
  initialCounts,
}: {
  children: React.ReactNode;
  userEmail?: string;
  initialCounts?: AdminNavCounts;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, loading, signOut } = useSession();
  const { counts, refresh: refreshNavCounts } = useAdminNavCounts(initialCounts);
  const { collapsed, toggleCollapsed } = useAdminSidebar();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  useBodyScrollLock(drawerOpen);

  const displayEmail = userEmail || user?.email;
  const isServerVerified = Boolean(userEmail);

  // تحديث عدّادات الـ sidebar أثناء التنقل بين الأقسام
  useEffect(() => {
    if (loading || (!user && !isServerVerified)) return;
    const timer = window.setTimeout(() => {
      void refreshNavCounts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, loading, user, isServerVerified, refreshNavCounts]);

  // إنعاش العدّادات بعد أي عملية متابعة ناجحة (approve/reject/review/dismiss/read)
  useEffect(() => {
    const onNavRefresh = () => void refreshNavCounts();
    window.addEventListener("admin-nav-refresh", onNavRefresh);
    return () => window.removeEventListener("admin-nav-refresh", onNavRefresh);
  }, [refreshNavCounts]);

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
    if (!loading && !user && !isServerVerified) {
      router.replace("/login?reason=admin&next=/admin");
    }
  }, [loading, user, isServerVerified, router]);

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

  const currentTitle = getAdminNavTitle(pathname);

  async function handleSignOut() {
    await signOut("/login?reason=admin&next=/admin");
  }

  if (loading && !isServerVerified) {
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

  if (!isServerVerified && !user) return null;

  if (!loading && user && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="grid w-full max-w-sm gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="text-base font-bold text-accent">
            الحساب الحالي مسجل دخول لكنه ليس مشرفاً.
          </p>
          <AdminButton type="button" onClick={handleSignOut}>
            تسجيل الخروج
          </AdminButton>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 border-e border-border bg-elevated transition-all duration-300 ease-in-out lg:flex ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          <AdminSidebar
            onSignOut={() => void handleSignOut()}
            email={displayEmail}
            counts={counts ?? undefined}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
          />
        </aside>

        {/* Mobile Clean Drawer */}
        <AdminDrawer
          isOpen={drawerOpen}
          isClosing={drawerClosing}
          onClose={closeDrawer}
          onSignOut={() => void handleSignOut()}
          email={displayEmail}
          counts={counts ?? undefined}
        />

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="فتح القائمة"
                onClick={openDrawer}
                className="rounded-lg border border-border p-2 text-foreground hover:bg-card lg:hidden"
              >
                <IconMenu className="h-5 w-5" />
              </button>
              <span className="font-heading text-lg font-extrabold text-foreground">
                {currentTitle}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TopbarAttentionChip counts={counts ?? undefined} />
              <ThemeToggle />
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
      <NotificationsToast />
    </ToastProvider>
  );
}
