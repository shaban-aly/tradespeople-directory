"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { AdminSidebarBrand } from "@/components/admin/AdminSidebarBrand";
import { AdminSidebarFooter } from "@/components/admin/AdminSidebarFooter";
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
    <div
      className={`flex h-full flex-col overflow-x-hidden ${
        collapsed ? "p-2.5" : "p-3"
      }`}
    >
      {!hideBrand && (
        <AdminSidebarBrand
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      )}

      {/* القائمة تاخد المساحة المتبقية — السكرول مجرد fallback لشاشات قصيرة جداً */}
      <div className="custom-scrollbar my-1 min-h-0 flex-1 overflow-y-auto">
        <AdminNav counts={counts} collapsed={collapsed} />
      </div>

      <AdminSidebarFooter email={email} collapsed={collapsed} onSignOut={onSignOut} />
    </div>
  );
}
