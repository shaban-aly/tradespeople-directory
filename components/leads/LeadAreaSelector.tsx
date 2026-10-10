"use client";

import { Modal } from "@/components/shared/ui/Modal";
import { IconCheck, IconChevronDown, IconMapPin, IconSearch, IconX } from "@/components/shared/icons";
import { AlertCircle } from "lucide-react";
import { useLeadAreaSelector } from "@/hooks/leads/useLeadAreaSelector";

export type LeadAreaItem = {
  id: string;
  name: string;
};

interface LeadAreaSelectorProps {
  areas: LeadAreaItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  error?: string;
}

export function LeadAreaSelector({
  areas,
  selectedId,
  onSelect,
  disabled = false,
  error,
}: LeadAreaSelectorProps) {
  const {
    modalOpen,
    setModalOpen,
    query,
    setQuery,
    selectedArea,
    filteredAreas,
    handleSelect,
  } = useLeadAreaSelector({
    areas,
    selectedId,
    onSelect,
    disabled,
  });

  return (
    <div>
      <input type="hidden" name="area_id" value={selectedId} required />

      <label className="block text-sm font-bold mb-1.5 text-foreground">
        في أي منطقة؟ <span className="text-danger">*</span>
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setModalOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
        className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-start transition-colors ${
          error
            ? "border-danger bg-danger/5 focus:border-danger focus:ring-2 focus:ring-danger/20"
            : "border-border bg-background hover:border-border-strong hover:bg-accent/5 focus:border-accent focus:ring-2 focus:ring-accent/20"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {selectedArea ? (
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <IconMapPin className="h-4 w-4" />
            </span>
            <div>
              <span className="block text-base font-bold text-foreground">
                {selectedArea.name}
              </span>
              <span className="block text-xs text-muted">اضغط لتغيير المنطقة</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted">
            <IconMapPin className="h-4 w-4" />
            <span className="text-base">اختر منطقتك أو حيك...</span>
          </div>
        )}

        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/10 text-muted">
          <IconChevronDown className="h-4 w-4" />
        </span>
      </button>

      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-danger animate-in fade-in duration-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setQuery("");
        }}
        title="اختر المنطقة أو الحي"
        description="حدد منطقتك لتوجيه الطلب للفنيين المتواجدين بالقرب منك."
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن منطقتك (مثلاً: المعادي، مدينة نصر، الشيخ زايد...)"
              className="w-full rounded-xl border border-border bg-background px-9 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              autoFocus
            />
            <IconSearch className="pointer-events-none absolute start-3 top-3.5 h-4 w-4 text-muted" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="مسح البحث"
                className="absolute end-3 top-3 text-muted hover:text-foreground"
              >
                <IconX className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid max-h-[50vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {filteredAreas.map((area) => {
              const isSelected = area.id === selectedId;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleSelect(area.id)}
                  className={`flex min-h-12 items-center justify-between rounded-xl border p-3 text-start transition-all ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border/70 bg-card hover:border-accent/70 hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconMapPin
                      className={`h-4 w-4 ${
                        isSelected ? "text-accent" : "text-muted"
                      }`}
                    />
                    <span className="text-sm font-bold text-foreground">
                      {area.name}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent">
                      <IconCheck className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}

            {filteredAreas.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-muted">
                لا توجد مناطق مطابقة للبحث &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
