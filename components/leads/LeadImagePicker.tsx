"use client";

import { useEffect, useRef, useState } from "react";
import { IconCamera, IconGrid, IconTrash, IconX } from "@/components/shared/icons";
import { Modal } from "@/components/shared/ui/Modal";
import {
  createImagePreview,
  LEAD_IMAGES_MAX,
  revokeImagePreview,
  validateImage,
} from "@/lib/storage/images";

export type LeadImageSelection = {
  /** روابط عامة محفوظة (تبقى ما لم تُحذف). */
  kept: string[];
  /** ملفات جديدة محلية (تُرفع لحظة الإرسال). */
  files: File[];
};

type PreviewItem = { file: File; preview: string };

/**
 * منتقي صور المشكلة (اختياري — حد 3 إجمالاً مع المحفوظ).
 * يحتفظ بالملفات محلياً فقط؛ الرفع يتم لحظة الإرسال عبر
 * `uploadLeadTempImages` فلا ملفات يتيمة عند التراجع.
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
  const [kept, setKept] = useState<string[]>(initialUrls);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [localError, setLocalError] = useState("");
  const [choiceOpen, setChoiceOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);

  const total = kept.length + items.length;
  const full = total >= LEAD_IMAGES_MAX;

  // تنظيف object URLs عند إزالة العنصر أو unmount.
  useEffect(() => {
    previewsRef.current = items.map((i) => i.preview);
  }, [items]);
  useEffect(() => {
    const stash = previewsRef;
    return () => {
      for (const url of stash.current) revokeImagePreview(url);
    };
  }, []);

  function emit(nextKept: string[], nextItems: PreviewItem[]) {
    onChange?.({ kept: nextKept, files: nextItems.map((i) => i.file) });
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || disabled) return;
    setLocalError("");
    const next = [...items];
    for (const file of Array.from(fileList)) {
      if (kept.length + next.length >= LEAD_IMAGES_MAX) {
        setLocalError(`الحد الأقصى ${LEAD_IMAGES_MAX} صور فقط`);
        break;
      }
      const invalid = validateImage(file);
      if (invalid) {
        setLocalError(invalid);
        continue;
      }
      next.push({ file, preview: createImagePreview(file) });
    }
    setItems(next);
    emit(kept, next);
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  /** اختيار من المودال: إغلاقه أولاً ثم فتح المصدر المناسب. */
  function choose(source: "camera" | "device") {
    setChoiceOpen(false);
    if (disabled || full) return;
    // مهلة قصيرة حتى يُغلَق المودال قبل فتح منتقي النظام (سلوك أنظف على الموبايل).
    window.setTimeout(() => {
      if (source === "camera") cameraRef.current?.click();
      else inputRef.current?.click();
    }, 60);
  }

  function removeKept(url: string) {
    const next = kept.filter((u) => u !== url);
    setKept(next);
    emit(next, items);
  }

  function removeItem(preview: string) {
    revokeImagePreview(preview);
    const next = items.filter((i) => i.preview !== preview);
    setItems(next);
    emit(kept, next);
  }

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
                className="absolute -top-1.5 -start-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow disabled:opacity-50"
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
                className="absolute -top-1.5 -start-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow disabled:opacity-50"
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
        className={`flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-base font-bold transition-colors ${
          disabled || full
            ? "cursor-not-allowed border-border bg-muted/10 text-muted opacity-60"
            : "border-accent/50 bg-accent/5 text-accent hover:border-accent hover:bg-accent/10 active:scale-[0.99]"
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
        <p className="mt-1 text-xs font-bold text-danger">{localError || error}</p>
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
