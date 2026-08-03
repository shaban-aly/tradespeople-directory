"use client";

import { useState } from "react";
import {
  convertToWebP,
  createImagePreview,
  revokeImagePreview,
  validateImage,
} from "@/lib/storage/images";

export function useImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  async function selectFile(next: File | undefined): Promise<File | null> {
    setError("");
    if (!next) return null;
    const validationError = validateImage(next);
    if (validationError) {
      setError(validationError);
      return null;
    }
    let converted = next;
    try {
      converted = await convertToWebP(next);
    } catch {
      setError("مقدرناش نحوّل الصورة لـ WebP — جرّب صورة تانية");
      return null;
    }
    setFile(converted);
    setPreview((prev) => {
      if (prev) revokeImagePreview(prev);
      return createImagePreview(converted);
    });
    return converted;
  }

  function removeImage() {
    setFile(null);
    setPreview((prev) => {
      if (prev) revokeImagePreview(prev);
      return "";
    });
    setError("");
  }

  return { file, preview, error, selectFile, removeImage };
}
