"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLeadsRealtime } from "@/hooks/leads/useLeadsRealtime";
import { OpenLeadCard } from "./OpenLeadCard";
import type { OpenLead } from "@/lib/db/leads";

/**
 * جزيرة العروض المفتوحة للفني: تستمع لحظياً لإشعارات `lead_new` وتميّز
 * الكارت الجديد بحلقة لمدة 10 ثوانٍ (التنبيه نفسه يغطيه Toast العام).
 * تُركَّب دائماً في الصفحة — حتى مع القائمة الفارغة — لتحل محل
 * `LeadsRealtimeBridge` هنا (اشتراك واحد يغطي الصفحة كلها).
 */
export function OpenLeadsLiveList({ open }: { open: OpenLead[] }) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleNewLead = useCallback((id: string) => {
    setHighlightId(id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHighlightId(null), 10_000);
  }, []);

  useLeadsRealtime(true, { onLeadInserted: handleNewLead });

  if (open.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {open.map((lead) => (
        <OpenLeadCard key={lead.id} lead={lead} highlight={lead.id === highlightId} />
      ))}
    </div>
  );
}
