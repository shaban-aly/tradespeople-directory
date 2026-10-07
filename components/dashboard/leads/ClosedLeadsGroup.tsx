"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ClaimedLeadCard } from "./ClaimedLeadCard";
import type { ClaimedLead } from "@/lib/db/leads";
import { toArabicDigits } from "@/lib/utils/format";

/**
 * مجموعة مطوية افتراضياً (مغلقة، أو مستلمة من ملفات أخرى) حتى لا تلوّث
 * قائمة "قبلتها" النشطة — تُفتح عند الحاجة فقط.
 */
export function ClosedLeadsGroup({
  leads,
  title = "طلبات مغلقة",
}: {
  leads: ClaimedLead[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  if (leads.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-2 bg-card px-4 py-3 text-base font-bold text-muted transition-colors hover:text-foreground"
      >
        <span>{title} ({toArabicDigits(leads.length)})</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-4 border-t border-border/60 p-4">
          {leads.map((lead) => (
            <ClaimedLeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
