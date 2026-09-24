"use client";

import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { IconX } from "@/components/shared/icons";
import type { AdminNavCounts } from "@/lib/db/admin";

export function AdminDrawer({
  isOpen,
  isClosing,
  onClose,
  onSignOut,
  email,
  counts,
}: {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  onSignOut: () => void;
  email?: string;
  counts?: AdminNavCounts;
}) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${
        isClosing ? "pointer-events-none" : ""
      }`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="إغلاق القائمة"
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Drawer Panel */}
      <aside
        className={`absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-s border-border bg-elevated shadow-2xl transition-transform duration-300 ease-out ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Clean Single Drawer Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-card/40">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-xl"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-heading font-extrabold text-sm shadow-sm">
              د
            </div>
            <div>
              <span className="block font-heading text-sm font-extrabold text-foreground leading-tight">
                دليل الصنايعية
              </span>
              <span className="text-[10px] font-semibold text-muted">
                لوحة التحكم
              </span>
            </div>
          </Link>

          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Body — hideBrand={true} prevents any duplicate header! */}
        <div className="flex-1 overflow-y-auto">
          <AdminSidebar
            onSignOut={onSignOut}
            email={email}
            counts={counts}
            collapsed={false}
            hideBrand={true}
          />
        </div>
      </aside>
    </div>
  );
}
