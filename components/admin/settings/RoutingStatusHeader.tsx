"use client";

import { ToggleSwitch } from "@/components/admin/ToggleSwitch";

interface RoutingStatusHeaderProps {
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
}

export function RoutingStatusHeader({
  enabled,
  onToggle,
  disabled = false,
}: RoutingStatusHeaderProps) {
  return (
    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-heading text-lg font-bold text-foreground">
            تحويل اتصالات ورسائل الموقع للإدارة
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              enabled
                ? "bg-action/15 text-action"
                : "bg-muted/15 text-muted"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                enabled ? "bg-action animate-pulse" : "bg-muted"
              }`}
            />
            {enabled ? "التحويل مفعّل الآن" : "معطّل — تواصل مباشر بالفنيين"}
          </span>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          عند التفعيل، يتم توجيه كافة أزرار الاتصال الهاتفي ورسائل الواتساب المعروضة في بطاقات وصفحات الصنايعية إلى رقمي الإدارة مناصفة بدلاً من التواصل المباشر.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3.5 self-start rounded-2xl border border-border/80 bg-background/50 px-4 py-3 sm:self-center">
        <span className="text-sm font-bold text-foreground">
          {enabled ? "تشغيل التحويل" : "إيقاف التحويل"}
        </span>
        <ToggleSwitch
          checked={enabled}
          onChange={onToggle}
          disabled={disabled}
          label="تفعيل أو تعطيل تحويل الاتصالات والرسائل للإدارة"
        />
      </div>
    </div>
  );
}
