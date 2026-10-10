"use client";

import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { Modal } from "@/components/shared/ui/Modal";
import { IconCheck, IconChevronDown, IconSearch, IconX } from "@/components/shared/icons";
import { AlertCircle } from "lucide-react";
import { useLeadCategorySelector } from "@/hooks/leads/useLeadCategorySelector";

export type LeadCategoryItem = {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
};

interface LeadCategorySelectorProps {
  categories: LeadCategoryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  error?: string;
}

export function LeadCategorySelector({
  categories,
  selectedId,
  onSelect,
  disabled = false,
  error,
}: LeadCategorySelectorProps) {
  const {
    modalOpen,
    setModalOpen,
    query,
    setQuery,
    selectedCategory,
    quickCategories,
    filteredCategories,
    handleSelect,
  } = useLeadCategorySelector({
    categories,
    selectedId,
    onSelect,
    disabled,
  });

  return (
    <div>
      <input type="hidden" name="category_id" value={selectedId} required />

      <label className="block text-sm font-bold mb-1.5 text-foreground">
        ما هو التخصص المطلوب؟ <span className="text-danger">*</span>
      </label>

      {/* شريط الاختيار السريع بنقرة واحدة */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {quickCategories.map((cat) => {
          const isSelected = cat.id === selectedId;
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-accent text-on-accent border border-accent shadow-sm"
                  : "bg-card text-foreground hover:bg-accent/5 hover:border-accent/40 border border-border active:scale-[0.98]"
              } disabled:opacity-60`}
            >
              <CategoryIcon
                name={cat.icon || cat.slug || "wrench"}
                className={`h-3.5 w-3.5 transition-colors ${isSelected ? "text-on-accent" : "text-accent"}`}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* زر فتح المحدد الكامل */}
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
        {selectedCategory ? (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <CategoryIcon
                name={selectedCategory.icon || selectedCategory.slug || "wrench"}
                className="h-5 w-5"
              />
            </span>
            <div>
              <span className="block text-base font-bold text-foreground">
                {selectedCategory.name}
              </span>
              <span className="block text-xs text-muted">اضغط للتغيير</span>
            </div>
          </div>
        ) : (
          <span className="text-base text-muted">
            اختر التخصص من القائمة الكاملة...
          </span>
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

      {/* نافذة اختيار التخصص مع أيقونات المهن */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setQuery("");
        }}
        title="اختر تخصص الصنايعي"
        description="اختر التخصص الأنسب لمشكلتك لتوجيه الطلب للفنيين المختصين."
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن التخصص (مثلاً: سباك، نجار، كهربائي...)"
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
            {filteredCategories.map((cat) => {
              const isSelected = cat.id === selectedId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className={`flex min-h-12 items-center justify-between rounded-xl border p-3 text-start transition-all ${isSelected
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border/70 bg-card hover:border-accent/70 hover:bg-accent/5"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSelected
                          ? "bg-accent text-on-accent"
                          : "bg-accent/10 text-accent"
                        }`}
                    >
                      <CategoryIcon
                        name={cat.icon || cat.slug || "wrench"}
                        className="h-5 w-5"
                      />
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {cat.name}
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

            {filteredCategories.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-muted">
                لا توجد تخصصات مطابقة للبحث &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
