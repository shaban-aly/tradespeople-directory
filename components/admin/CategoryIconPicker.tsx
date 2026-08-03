"use client";

import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { CATEGORY_ICON_OPTIONS } from "@/hooks/admin/useAdminDashboard";

const ICON_LABELS: Record<(typeof CATEGORY_ICON_OPTIONS)[number], string> = {
  plumbing: "سباكة",
  electrical: "كهرباء",
  carpentry: "نجارة",
  hvac: "تكييف",
  painting: "دهانات",
  tiling: "سيراميك",
  aluminum: "ألوميتال",
  metalwork: "حدادة",
  masonry: "بناء",
  marble: "رخام",
  glass: "زجاج",
  welding: "لحام",
  locksmith: "أقفال",
  mechanic: "ميكانيكا",
  appliances: "أجهزة منزلية",
  upholstery: "تنجيد",
  cleaning: "تنظيف",
  pest: "مكافحة حشرات",
  moving: "نقل عفش",
  elevator: "مصاعد",
  satellite: "دش",
  security: "كاميرات",
  roofing: "عزل أسقف",
  garden: "تنسيق حدائق",
  parquet: "باركيه",
  kitchen: "مطابخ",
  bathroom: "حمامات",
  handyman: "صنايعي عام",
};

export function CategoryIconPicker({
  value,
  onChange,
}: {
  value: (typeof CATEGORY_ICON_OPTIONS)[number];
  onChange: (next: (typeof CATEGORY_ICON_OPTIONS)[number]) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {CATEGORY_ICON_OPTIONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-base transition-colors ${
            value === icon
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-muted hover:border-accent/40 hover:text-foreground"
          }`}
        >
          <CategoryIcon name={icon} className="h-6 w-6" />
          <span className="text-xs">{ICON_LABELS[icon]}</span>
        </button>
      ))}
    </div>
  );
}
