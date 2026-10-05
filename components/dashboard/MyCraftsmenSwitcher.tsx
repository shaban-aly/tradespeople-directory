"use client";

import { type CraftsmanBrief } from "@/lib/db/craftsman-dashboard";
import { IconPlus, IconCheck, IconUser } from "@/components/shared/icons";
import { supabaseTransformUrl } from "@/lib/utils/image-transform";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MyCraftsmenSwitcherProps {
  craftsmen: CraftsmanBrief[];
  activeCraftsmanId: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: "قيد المراجعة", color: "text-amber-500 bg-amber-500/10" },
  approved: { label: "معتمد",        color: "text-green-600 bg-green-500/10" },
  rejected: { label: "مرفوض",        color: "text-red-500 bg-red-500/10" },
};

export function MyCraftsmenSwitcher({
  craftsmen,
  activeCraftsmanId,
}: MyCraftsmenSwitcherProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (craftsmen.length === 0) return null;

  function handleSwitch(craftsmanId: string) {
    if (craftsmanId === activeCraftsmanId) return;
    setLoading(craftsmanId);
    router.push(`/dashboard?craftsman=${craftsmanId}`);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-background/40">
        <h2 className="text-sm font-bold text-foreground">ملفاتي المهنية</h2>
        <a
          href="/join"
          className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline transition-colors"
        >
          <IconPlus className="h-3.5 w-3.5" />
          <span>إضافة تخصص</span>
        </a>
      </div>

      {/* Craftsmen list */}
      <div className="divide-y divide-border/40">
        {craftsmen.map((c) => {
          const isActive = c.id === activeCraftsmanId;
          const statusMeta = STATUS_LABEL[c.status] ?? STATUS_LABEL.pending;
          const isLoading = loading === c.id;

          return (
            <button
              key={c.id}
              onClick={() => handleSwitch(c.id)}
              disabled={isActive || isLoading}
              className={[
                "w-full flex items-center gap-3 px-4 py-3 text-right transition-colors",
                isActive
                  ? "bg-accent/5 cursor-default"
                  : "hover:bg-muted/30 cursor-pointer",
              ].join(" ")}
            >
              {/* Avatar */}
              <div className="relative shrink-0 h-10 w-10 rounded-xl overflow-hidden bg-background border border-border">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={supabaseTransformUrl(c.imageUrl, {
                      width: 80,
                      height: 80,
                      resize: "cover",
                    }) ?? c.imageUrl}
                    alt={c.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/favicon-96x96.png"; }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted">
                    <IconUser className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted truncate">{c.categoryName}</p>
              </div>

              {/* Right side: status badge + active indicator */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-accent font-bold">
                    <IconCheck className="h-3 w-3" />
                    نشط
                  </span>
                )}
                {isLoading && (
                  <span className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
