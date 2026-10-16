"use client";

import { IconInfo } from "@/components/shared/icons";
import type { AdminPhoneNumber } from "@/lib/db/settings";

interface RoutingDistributionVisualizerProps {
  numbers: AdminPhoneNumber[];
}

export function RoutingDistributionVisualizer({
  numbers,
}: RoutingDistributionVisualizerProps) {
  const activeNumbers = numbers.filter((n) => n.active && n.phone.trim());
  const count = activeNumbers.length;
  const share = count > 0 ? (100 / count).toFixed(1) : "0";

  return (
    <div className="rounded-2xl border border-border/80 bg-background/30 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <IconInfo className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-sm font-bold text-foreground">
            آلية التوزيع العادل والمستقر (Deterministic Load Balancing — {share}% لكل خط نشط)
          </h3>
          <p className="text-xs leading-relaxed text-muted">
            يتم توزيع الصنايعية تلقائياً وبالتساوي على الأرقام النشطة المحددة. الفني الواحد
            يظل مرتبطاً دائماً بنفس خط الإدارة (سواء اختار العميل الاتصال أو مراسلة
            الواتساب)، مما يضمن عدم تشتيت العميل ومتابعة نفس مسؤول الإدارة للطلب.
          </p>
        </div>
      </div>

      {/* تمثيل الخطوط النشطة وحصص التوزيع */}
      {count === 0 ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-center text-xs font-bold text-warning">
          لا توجد أرقام نشطة حالياً — يرجى تفعيل خط واحد على الأقل.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {activeNumbers.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent">
                  {idx + 1}
                </span>
                <div className="truncate">
                  <span className="font-bold text-foreground block truncate">
                    {item.label || `خط ${idx + 1}`}:
                  </span>
                  <span className="font-mono text-muted block text-xs" dir="ltr">
                    {item.phone}
                  </span>
                </div>
              </div>
              <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent shrink-0">
                {share}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
