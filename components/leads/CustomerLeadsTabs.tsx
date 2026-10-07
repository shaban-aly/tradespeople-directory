"use client";

import { useMemo, useState } from "react";
import { FilterTabs } from "@/components/shared/ui/FilterTabs";
import { CustomerLeadCard } from "./CustomerLeadCard";
import {
  partitionCustomerLeads,
  type CustomerLead,
} from "@/lib/db/leads";

type Tab = "active" | "past";

/**
 * تبويبا طلبات العميل (النشطة/السابقة) — يلتفان تلقائياً على الشاشات
 * الضيقة بلا قصّ، مع عدّادات عربية.
 */
export function CustomerLeadsTabs({
  leads,
  emptyActiveAction,
}: {
  leads: CustomerLead[];
  emptyActiveAction?: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("active");
  const { active, past } = useMemo(() => partitionCustomerLeads(leads), [leads]);
  const visible = tab === "active" ? active : past;

  return (
    <div className="space-y-6">
      <FilterTabs<Tab>
        tabs={[
          { value: "active", label: "النشطة", count: active.length },
          { value: "past", label: "السابقة", count: past.length },
        ]}
        active={tab}
        onChange={setTab}
      />
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-base font-bold text-foreground">
            {tab === "active" ? "لا توجد طلبات نشطة حالياً" : "لا توجد طلبات سابقة بعد"}
          </p>
          {tab === "active" && emptyActiveAction && (
            <div className="mx-auto mt-4 w-fit">{emptyActiveAction}</div>
          )}
        </div>
      ) : (
        visible.map((lead) => <CustomerLeadCard key={lead.id} lead={lead} />)
      )}
    </div>
  );
}
