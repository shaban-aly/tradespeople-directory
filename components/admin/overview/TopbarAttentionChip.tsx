"use client";

import Link from "next/link";
import type { AdminNavCounts } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

// ترتيب الأولوية لأعلى قسم يحتاج إجراءً (طلبات → بلاغات → رسائل غير مقروءة).
const ATTENTION_PRIORITY: {
  href: string;
  count: (counts: AdminNavCounts) => number;
}[] = [
  { href: "/admin/requests", count: (c) => c.pendingRequests },
  { href: "/admin/reports", count: (c) => c.pendingReports },
  { href: "/admin/messages", count: (c) => c.unreadMessages },
];

/** شريحة «متابعة» في الشريط العلوي — تبقى مرئية ولو أُخفيت القائمة على الموبايل.
 *  تعرض إجمالي ما يحتاج إجراءً وتربط بأعلى قسم أولوية. مخفية عند الصفر. */
export function TopbarAttentionChip({
  counts,
}: {
  counts?: AdminNavCounts;
}) {
  if (!counts) return null;

  const total =
    counts.pendingRequests + counts.pendingReports + counts.unreadMessages;
  if (total <= 0) {
    return null;
  }

  const target =
    ATTENTION_PRIORITY.find((entry) => entry.count(counts) > 0) ??
    ATTENTION_PRIORITY[0];

  return (
    <Link
      href={target.href}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-elevated px-3 py-1.5 text-sm font-bold text-accent transition-colors hover:border-accent/40 hover:text-foreground"
      aria-label="ما يحتاج متابعة — طلبات وبلاغات ورسائل غير مقروءة"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-background">
        {toArabicDigits(
          counts.pendingRequests +
            counts.pendingReports +
            counts.unreadMessages,
        )}
      </span>
      <span className="hidden sm:inline">متابعة</span>
    </Link>
  );
}
