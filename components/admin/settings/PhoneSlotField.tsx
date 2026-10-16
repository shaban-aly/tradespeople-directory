"use client";

import { IconPhone, IconWhatsApp } from "@/components/shared/icons";

interface PhoneSlotFieldProps {
  id: string;
  slotNumber: 1 | 2;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PhoneSlotField({
  id,
  slotNumber,
  label,
  value,
  onChange,
  placeholder = "+20 100 000 0000",
  disabled = false,
}: PhoneSlotFieldProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-background/40 p-4 transition-colors hover:border-border focus-within:border-accent">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-bold text-foreground"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-xs font-black text-accent">
            {slotNumber}
          </span>
          <span>{label}</span>
        </label>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1 text-xs font-bold text-foreground shadow-xs">
          <IconPhone className="h-3 w-3 text-accent" />
          <IconWhatsApp className="h-3 w-3 text-action" />
          <span>مكالمات + واتساب</span>
        </span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
          <IconPhone className="h-4 w-4" />
        </div>
        <input
          id={id}
          type="tel"
          dir="ltr"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-background py-2.5 pr-3.5 pl-10 font-mono text-base font-semibold text-foreground placeholder:text-muted/60 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
          required
        />
      </div>

      <p className="text-xs text-muted">
        يعمل كنقطة اتصال واستقبال واتساب معاً لنصف صنايعية المنصة (50%).
      </p>
    </div>
  );
}
