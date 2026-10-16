"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";

interface SimulationResult {
  slot: number;
  label: string;
  phone: string;
  whatsapp: string;
  adminMessage: string;
  directMessage: string;
}

interface RoutingSimulatorProps {
  simName: string;
  setSimName: (val: string) => void;
  simCategory: string;
  setSimCategory: (val: string) => void;
  result: SimulationResult;
  routingEnabled: boolean;
}

export function RoutingSimulator({
  simName,
  setSimName,
  simCategory,
  setSimCategory,
  result,
  routingEnabled,
}: RoutingSimulatorProps) {
  const quickSamples = [
    { name: "محمود السباك", cat: "سباكة" },
    { name: "أحمد النجار", cat: "نجارة" },
    { name: "علي الكهربائي", cat: "كهرباء" },
    { name: "خالد النقاش", cat: "نقاشة" },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-background/20 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground">
            أداة تجربة التوجيه والمعاينة الفورية (Live Routing Simulator)
          </h3>
          <p className="text-xs text-muted">
            جرّب كتابة اسم فني أو اختر نموذجاً سريعاً لمعاينة أي خط سيستقبل مكالمته ورسائل الواتساب.
          </p>
        </div>

        {/* أزرار نماذج سريعة */}
        <div className="flex flex-wrap items-center gap-1.5">
          {quickSamples.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => {
                setSimName(sample.name);
                setSimCategory(sample.cat);
              }}
              className="rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-accent transition-colors"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* حقول التجربة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="sim-craftsman-name"
            className="text-xs font-bold text-foreground"
          >
            اسم الفني للتجربة:
          </label>
          <input
            id="sim-craftsman-name"
            type="text"
            value={simName}
            onChange={(e) => setSimName(e.target.value)}
            placeholder="مثال: أحمد عبد الله"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="sim-craftsman-category"
            className="text-xs font-bold text-foreground"
          >
            التخصص:
          </label>
          <input
            id="sim-craftsman-category"
            type="text"
            value={simCategory}
            onChange={(e) => setSimCategory(e.target.value)}
            placeholder="مثال: كهربائي منازل"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* نتائج المحاكاة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* الخط الموجه إليه */}
        <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              الوجهة المستهدفة للفني:
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                routingEnabled
                  ? "bg-action/15 text-action"
                  : "bg-muted/15 text-muted"
              }`}
            >
              {routingEnabled ? "التحويل نشط" : "تحويل متوقف (مباشر)"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent font-bold text-base">
              {result.slot}
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-foreground truncate">
                {result.label}
              </p>
              <p className="font-mono text-xs font-semibold text-muted" dir="ltr">
                {result.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-xs text-muted">
            <span className="flex items-center gap-1 text-accent font-bold">
              <IconPhone className="h-3 w-3" />
              مكالمات
            </span>
            <span>+</span>
            <span className="flex items-center gap-1 text-action font-bold">
              <IconWhatsApp className="h-3 w-3" />
              واتساب
            </span>
          </div>
        </div>

        {/* فقاعة رسالة الإدارة */}
        <div className="flex flex-col justify-between rounded-xl border border-action/30 bg-action/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-action">
              <IconWhatsApp className="h-4 w-4" />
              <span>رسالة الإدارة (مع التفعيل):</span>
            </div>
            <span className="text-xs text-muted font-mono">تلقائي</span>
          </div>

          <div
            className="rounded-2xl rounded-tl-sm border border-action/20 bg-card p-3 text-xs leading-relaxed text-foreground shadow-xs"
            dir="rtl"
          >
            <p className="font-medium text-foreground select-all">
              «{result.adminMessage}»
            </p>
          </div>

          <p className="text-xs text-muted leading-tight">
            تصل لمسؤول الإدارة المحدد في الخط أعلاه.
          </p>
        </div>

        {/* فقاعة رسالة التواصل المباشر */}
        <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <IconWhatsApp className="h-4 w-4 text-accent" />
              <span>رسالة الفني (عند التعطيل):</span>
            </div>
            <span className="text-xs text-muted font-mono">مباشر</span>
          </div>

          <div
            className="rounded-2xl rounded-tl-sm border border-border/60 bg-card p-3 text-xs leading-relaxed text-foreground shadow-xs"
            dir="rtl"
          >
            <p className="font-medium text-foreground select-all">
              «{result.directMessage}»
            </p>
          </div>

          <p className="text-xs text-muted leading-tight">
            تظهر للعميل عند مراسلة الصانع مباشرة.
          </p>
        </div>
      </div>
    </div>
  );
}
