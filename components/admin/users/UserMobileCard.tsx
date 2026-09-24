import Link from "next/link";
import {
  IconExternalLink,
  IconShieldCheck,
  IconWrench,
} from "@/components/shared/icons";
import { UserAvatar } from "@/components/admin/users/UserAvatar";
import type { AdminUserRow } from "@/lib/db/admin";
import { formatRelativeTimeArabic } from "@/lib/utils/format";

interface UserMobileCardProps {
  user: AdminUserRow;
}

export function UserMobileCard({ user }: UserMobileCardProps) {
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
