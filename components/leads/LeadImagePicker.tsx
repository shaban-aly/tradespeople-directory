"use client";

import { IconCamera, IconGrid, IconTrash, IconX } from "@/components/shared/icons";
import { Modal } from "@/components/shared/ui/Modal";
import { AlertCircle } from "lucide-react";
import { LEAD_IMAGES_MAX } from "@/lib/storage/images";
import { useLeadImagePicker } from "@/hooks/leads/useLeadImagePicker";

export type LeadImageSelection = {
  /** روابط عامة محفوظة (تبقى ما لم تُحذف). */
  kept: string[];
  /** ملفات جديدة محلية (تُرفع لحظة الإرسال). */
  files: File[];
};

/**
 * منتقي صور المشكلة — مكوّن عرض يركز على الـ UI.
 * منطق الرفع والمعاينة والتحقق مفصول في `useLeadImagePicker`.
 */
export function LeadImagePicker({
  initialUrls = [],
  disabled = false,
  onChange,
  error,
}: {
  initialUrls?: string[];
  disabled?: boolean;
  onChange?: (selection: LeadImageSelection) => void;
  error?: string;
}) {
  const {
    kept,
    items,
    localError,
    choiceOpen,
    setChoiceOpen,
    inputRef,
    cameraRef,
    total,
    full,
    addFiles,
    choose,
    removeKept,
    removeItem,
  } = useLeadImagePicker({
    initialUrls,
    disabled,
    onChange,
  });

  return (
    <div>
      <span className="block text-sm font-bold mb-1">
        صور المشكلة <span className="font-normal text-muted">(اختياري — حتى {LEAD_IMAGES_MAX})</span>
      </span>

      {(kept.length > 0 || items.length > 0) && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {kept.map((url) => (
            <div key={url} className="relative h-20 w-20 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="صورة محفوظة للمشكلة"
                className="h-full w-full rounded-xl border border-border/60 object-cover"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeKept(url)}
                aria-label="حذف الصورة المحفوظة"
                className="absolute -top-1.5 -start-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-on-danger shadow-sm hover:scale-105 transition-transform disabled:opacity-50"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {items.map((item) => (
            <div key={item.preview} className="relative h-20 w-20 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt="صورة جديدة للمشكلة"
                className="h-full w-full rounded-xl border border-accent/40 object-cover"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeItem(item.preview)}
                aria-label="إزالة الصورة المختارة"
                className="absolute -top-1.5 -start-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-on-danger shadow-sm hover:scale-105 transition-transform disabled:opacity-50"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || full}
        onChange={(e) => addFiles(e.target.files)}
        aria-label="اختيار صور المشكلة من الجهاز"
        className="sr-only"
        tabIndex={-1}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled || full}
        onChange={(e) => addFiles(e.target.files)}
        aria-label="تصوير المشكلة بالكاميرا"
        className="sr-only"
        tabIndex={-1}
      />
      <button
        type="button"
        disabled={disabled || full}
        onClick={() => setChoiceOpen(true)}
        aria-haspopup="dialog"
        className={`flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-base font-bold transition-all ${
          disabled || full
            ? "cursor-not-allowed border-border bg-muted/10 text-muted opacity-60"
            : "border-accent/40 bg-accent/5 text-accent hover:border-accent hover:bg-accent/10 active:bg-accent/15"
        }`}
      >
        <IconCamera className="h-5 w-5 shrink-0" />
        {full
          ? `تم اختيار الحد الأقصى (${LEAD_IMAGES_MAX} صور)`
          : total > 0
            ? `أضف صورة أخرى (${total}/${LEAD_IMAGES_MAX})`
            : "أضف صور المشكلة (اختياري)"}
      </button>
      <p className="mt-1 text-xs text-muted">
        JPG أو PNG أو WebP — حتى 5 ميجابايت للصورة.
      </p>
      {(localError || error) && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-danger animate-in fade-in duration-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{localError || error}</span>
        </p>
      )}

      <Modal
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        title="أضف صورة"
        description="صوّر المشكلة مباشرة أو اختر صوراً موجودة على جهازك."
      >
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => choose("camera")}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-start transition-colors hover:border-accent hover:bg-accent/5 active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <IconCamera className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-bold">صوّر بالكاميرا</span>
              <span className="block text-xs text-muted">التقط صورة للمشكلة الآن</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => choose("device")}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-start transition-colors hover:border-accent hover:bg-accent/5 active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <IconGrid className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-bold">اختر من الجهاز</span>
              <span className="block text-xs text-muted">من المعرض أو الملفات (حتى {LEAD_IMAGES_MAX} صور)</span>
            </span>
          </button>
        </div>
      </Modal>
    </div>
  );
}
