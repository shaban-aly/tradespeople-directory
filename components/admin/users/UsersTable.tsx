import Link from "next/link";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/admin/ui/DataTable";
import {
  IconExternalLink,
  IconShieldCheck,
  IconWrench,
} from "@/components/shared/icons";
import { UserAvatar } from "@/components/admin/users/UserAvatar";
import { UserMobileCard } from "@/components/admin/users/UserMobileCard";
import type { AdminUserRow } from "@/lib/db/admin";
import { formatRelativeTimeArabic } from "@/lib/utils/format";

interface UsersTableProps {
  users: AdminUserRow[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <>
      {/* كروت الموبايل والشاشات الصغيرة */}
      <div className="grid gap-3 w-full max-w-full overflow-hidden md:hidden">
        {users.map((user) => (
          <UserMobileCard key={user.id} user={user} />
        ))}
      </div>

      {/* جدول البيانات للشاشات المتوسطة والكبيرة */}
      <div className="hidden md:block">
        <DataTable
          headers={["المستخدم", "الدور", "الحساب المرتبط", "تاريخ الانضمام"]}
          minWidth={600}
        >
          {users.map((user) => {
            const isCraftsman = user.role === "craftsman";
            const isAdmin = user.role === "admin";

            return (
              <DataTableRow key={user.id}>
                {/* المستخدم */}
                <DataTableCell edge="start">
                  <div className="flex items-center gap-3">
                    <UserAvatar url={user.avatarUrl} name={user.displayName} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-foreground">
                        {user.displayName}
                      </p>
                      <p
                        className="max-w-[160px] truncate text-xs text-muted sm:max-w-[240px] text-right"
                        title={user.email ?? user.id}
                      >
                        {user.email || "بدون بريد"}
                      </p>
                    </div>
                  </div>
                </DataTableCell>

                {/* الدور */}
                <DataTableCell>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <IconShieldCheck className="h-3.5 w-3.5" />
                      مشرف
                    </span>
                  ) : isCraftsman ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                      <IconWrench className="h-3.5 w-3.5" />
                      فني / صنايعي
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/20 px-3 py-1 text-xs font-bold text-muted">
                      عميل
                    </span>
                  )}
                </DataTableCell>

                {/* الحساب المرتبط */}
                <DataTableCell>
                  {user.craftsmanName && user.craftsmanSlug ? (
                    <Link
                      href={`/craftsman/${encodeURIComponent(user.craftsmanSlug)}`}
                      className="inline-flex items-center gap-1 font-bold text-foreground transition-colors hover:text-accent"
                    >
                      <span>{user.craftsmanName}</span>
                      <IconExternalLink className="h-3.5 w-3.5 text-muted" />
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </DataTableCell>

                {/* تاريخ الانضمام */}
                <DataTableCell edge="end">
                  <span className="text-xs font-medium text-muted">
                    {formatRelativeTimeArabic(user.createdAt)}
                  </span>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTable>
      </div>
    </>
  );
}
