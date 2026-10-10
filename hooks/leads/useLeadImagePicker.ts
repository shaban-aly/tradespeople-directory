"use client";

import { useEffect, useRef, useState } from "react";
import {
  createImagePreview,
  LEAD_IMAGES_MAX,
  revokeImagePreview,
  validateImage,
} from "@/lib/storage/images";
import type { LeadImageSelection } from "@/components/leads/LeadImagePicker";

export type PreviewItem = { file: File; preview: string };

interface UseLeadImagePickerProps {
  initialUrls?: string[];
  disabled?: boolean;
  onChange?: (selection: LeadImageSelection) => void;
}

export function useLeadImagePicker({
  initialUrls = [],
  disabled = false,
  onChange,
}: UseLeadImagePickerProps) {
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

  return {
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
  };
}
