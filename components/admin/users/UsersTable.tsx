"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/admin/ui/DataTable";
import {
  IconUser,
  IconExternalLink,
  IconShieldCheck,
  IconWrench,
} from "@/components/shared/icons";
import type { AdminUserRow } from "@/lib/db/admin";
import { formatRelativeTimeArabic } from "@/lib/utils/format";

interface UsersTableProps {
  users: AdminUserRow[];
}

function UserAvatar({ url, name }: { url: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">
        {name.charAt(0) || <IconUser className="h-5 w-5" />}
      </div>
    );
  }

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
      <Image
        src={url}
        alt={name}
        fill
        sizes="40px"
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

function UserMobileCard({ user }: { user: AdminUserRow }) {
  const isCraftsman = user.role === "craftsman";
  const isAdmin = user.role === "admin";

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <UserAvatar url={user.avatarUrl} name={user.displayName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm sm:text-base font-bold text-foreground">
              {user.displayName}
            </p>
            <p
              className="truncate text-xs text-muted"
              title={user.email ?? user.id}
            >
              {user.email || "بدون بريد"}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <IconShieldCheck className="h-3 w-3" />
              مشرف
            </span>
          ) : isCraftsman ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">
              <IconWrench className="h-3 w-3" />
              فني
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/20 px-2.5 py-1 text-xs font-bold text-muted">
              عميل
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/50 p-2.5 text-xs text-muted">
        <div className="min-w-0 flex-1">
          {user.craftsmanName && user.craftsmanSlug ? (
            <Link
              href={`/craftsman/${encodeURIComponent(user.craftsmanSlug)}`}
              className="inline-flex items-center gap-1 font-bold text-foreground hover:text-accent transition-colors max-w-full"
            >
              <span className="truncate">{user.craftsmanName}</span>
              <IconExternalLink className="h-3 w-3 text-muted shrink-0" />
            </Link>
          ) : (
            <span className="text-muted/70">غير مرتبط بصانع</span>
          )}
        </div>

        <span className="shrink-0 font-medium">
          {formatRelativeTimeArabic(user.createdAt)}
        </span>
      </div>
    </div>
  );
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
