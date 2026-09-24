"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { IconSearch, IconUser } from "@/components/shared/icons";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import type { AdminUserRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

interface UsersSectionProps {
  initialUsers: AdminUserRow[];
}

export function UsersSection({ initialUsers }: UsersSectionProps) {
  const {
    users,
    filteredUsers,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    roleCounters,
  } = useAdminUsers(initialUsers);

  return (
    <div className="grid gap-4 sm:gap-6">
      <PageHeader
        title="المستخدمين"
        description={`إجمالي ${toArabicDigits(users.length)} حساب مسجل في الدليل.`}
      />

      {/* شريط الفلترة والبحث */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between w-full max-w-full overflow-hidden">
        {/* أزرار الفلترة حسب الدور */}
        <div className="flex flex-wrap items-center gap-1">
          {roleCounters.map((f) => {
            const active = roleFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setRoleFilter(f.value)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:text-sm cursor-pointer ${
                  active
                    ? "bg-accent text-accent-contrast shadow-sm"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[11px] font-black ${
                    active ? "bg-white/20 text-white" : "bg-muted/15 text-muted"
                  }`}
                >
                  {toArabicDigits(f.count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* حقل البحث */}
        <div className="relative w-full sm:w-64">
          <IconSearch className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-3 pr-9 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none sm:text-sm"
          />
        </div>
      </div>

      {/* جدول النتائج */}
      <div className="rounded-3xl border border-border bg-card p-3.5 shadow-card sm:p-6 w-full max-w-full overflow-hidden">
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="لا يوجد مستخدمين يطابقون البحث"
            description="جرّب تغيير خيارات الفلترة أو مسح عبارة البحث"
            icon={<IconUser className="h-6 w-6 text-muted" />}
          />
        ) : (
          <UsersTable users={filteredUsers} />
        )}
      </div>
    </div>
  );
}
