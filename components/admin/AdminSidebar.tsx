"use client";

import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconGlobe,
  IconLogOut,
} from "@/components/shared/icons";
import type { AdminNavCounts } from "@/lib/db/admin";

export function AdminSidebar({
  onSignOut,
  email,
  counts,
  collapsed = false,
  onToggleCollapse,
  hideBrand = false,
}: {
  onSignOut: () => void;
  email?: string;
  counts?: AdminNavCounts;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  hideBrand?: boolean;
}) {
  return (
    <div className={`flex h-full flex-col justify-between overflow-x-hidden ${collapsed ? "p-2.5" : "p-3.5"}`}>
      {/* Upper Area */}
      <div className="grid gap-3.5">
        {/* Brand Header */}
        {!hideBrand && (
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3">
            <Link
              href="/admin"
              className={`flex items-center gap-2.5 rounded-xl transition-colors hover:opacity-90 ${
                collapsed ? "mx-auto" : "px-1"
              }`}
              title="دليل الصنايعية - لوحة التحكم"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-heading font-extrabold text-base shadow-sm">
                د
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <span className="block font-heading text-base font-extrabold text-foreground truncate leading-tight">
                    دليل الصنايعية
                  </span>
                  <span className="text-[11px] font-semibold text-muted">
                    لوحة التحكم
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse toggle button on desktop */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={collapsed ? "توسيع السايد بار" : "طي السايد بار"}
                title={collapsed ? "توسيع" : "طي"}
                className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-accent hover:text-accent transition-colors"
              >
                {collapsed ? (
                  <IconChevronLeft className="h-4 w-4" />
                ) : (
                  <IconChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}

        {/* زر الانتقال إلى الموقع مباشرة */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="زيارة الموقع الأساسي"
          className={`flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/60 text-foreground transition-all duration-150 hover:border-accent/50 hover:bg-accent/10 hover:text-accent ${
            collapsed ? "justify-center p-2.5" : "px-3 py-2 text-sm font-semibold"
          }`}
        >
          <IconGlobe className="h-4 w-4 shrink-0 text-accent" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-xs font-bold">
                الانتقال للموقع
              </span>
              <IconExternalLink className="h-3.5 w-3.5 text-muted shrink-0" />
            </>
          )}
        </Link>

        {/* Main Navigation Items */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
          <AdminNav counts={counts} collapsed={collapsed} />
        </div>
      </div>

      {/* Footer Area / User & Logout */}
      <div className="mt-auto border-t border-border/70 pt-3 grid gap-2">
        {!collapsed && email && (
          <div className="px-2">
            <p className="text-xs font-bold text-foreground">المشرف</p>
            <p className="truncate text-[11px] text-muted font-medium" dir="ltr">
              {email}
            </p>
          </div>
        )}

        {collapsed ? (
          <button
            type="button"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
            onClick={onSignOut}
            className="flex h-9 w-9 mx-auto items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <IconLogOut className="h-4 w-4" />
          </button>
        ) : (
          <AdminButton
            type="button"
            variant="dangerHover"
            size="sm"
            onClick={onSignOut}
            className="w-full text-xs font-bold py-2"
          >
            <IconLogOut className="h-4 w-4 shrink-0" />
            <span>تسجيل الخروج</span>
          </AdminButton>
        )}
      </div>
    </div>
  );
}
