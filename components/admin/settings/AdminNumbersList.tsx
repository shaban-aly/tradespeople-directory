"use client";

import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  IconPhone,
  IconPlus,
  IconTrash,
  IconWhatsApp,
} from "@/components/shared/icons";
import type { AdminPhoneNumber } from "@/lib/db/settings";

interface AdminNumbersListProps {
  numbers: AdminPhoneNumber[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AdminPhoneNumber>) => void;
  onToggleActive: (id: string) => void;
  disabled?: boolean;
}

export function AdminNumbersList({
  numbers,
  onAdd,
  onRemove,
  onUpdate,
  onToggleActive,
  disabled = false,
}: AdminNumbersListProps) {
  const activeCount = numbers.filter((n) => n.active && n.phone.trim()).length;
  const activeSharePercent =
    activeCount > 0 ? (100 / activeCount).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <h3 className="font-heading text-base font-bold text-foreground">
            أرقام الإدارة المركزية (خطوط الاستقبال)
          </h3>
          <p className="text-xs text-muted">
            أضف أي عدد من الأرقام لاستقبال المكالمات ورسائل الواتساب. يتم توزيع
            الصنايعية بالتساوي على الأرقام النشطة فقط.
          </p>
        </div>

        <AdminButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="self-start sm:self-auto"
        >
          <IconPlus className="h-4 w-4" />
          <span>إضافة خط جديد</span>
        </AdminButton>
      </div>

      {/* قائمة الأرقام */}
      <div className="grid gap-3 sm:grid-cols-2">
        {numbers.map((item, idx) => {
          const isItemActive = item.active && item.phone.trim().length > 0;
          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 transition-all ${
                item.active
                  ? "border-border/80 bg-background/50 hover:border-accent/60"
                  : "border-border/40 bg-background/20 opacity-70"
              }`}
            >
              {/* الرأس: مسمى الخط + مفتاح التفعيل + زر الحذف */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-black text-accent">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item.label || ""}
                    onChange={(e) =>
                      onUpdate(item.id, { label: e.target.value })
                    }
                    placeholder={`خط الإدارة ${idx + 1}`}
                    className="w-full bg-transparent text-sm font-bold text-foreground placeholder:text-muted/60 focus:outline-none focus:border-b focus:border-accent"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ToggleSwitch
                    checked={item.active}
                    disabled={disabled}
                    onChange={() => onToggleActive(item.id)}
                    label={`تفعيل أو تعطيل ${item.label || `الخط ${idx + 1}`}`}
                  />
                  {numbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      title="حذف هذا الرقم"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* حقل إدخال الرقم */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
                  <IconPhone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  dir="ltr"
                  value={item.phone}
                  onChange={(e) =>
                    onUpdate(item.id, { phone: e.target.value })
                  }
                  placeholder="+20 100 000 0000"
                  className="w-full rounded-xl border border-border bg-background py-2 pr-3 pl-10 font-mono text-sm font-semibold text-foreground placeholder:text-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>

              {/* الشارات والحالة */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <span className="inline-flex items-center gap-1 font-semibold text-muted">
                  <IconPhone className="h-3 w-3 text-accent" />
                  <IconWhatsApp className="h-3 w-3 text-action" />
                  <span>اتصال + واتساب</span>
                </span>

                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                    isItemActive
                      ? "bg-action/10 text-action"
                      : "bg-muted/15 text-muted"
                  }`}
                >
                  {isItemActive
                    ? `حصة التوزيع: ${activeSharePercent}%`
                    : "معطّل مؤقتاً"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
