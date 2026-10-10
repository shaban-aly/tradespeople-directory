"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitLead } from "@/app/actions/leads";
import { uploadLeadTempImages } from "@/lib/storage/images";
import type { LeadImageSelection } from "@/components/leads/LeadImagePicker";
import type { LeadErrors } from "@/lib/utils/validation";

/** مسودة نصية فقط (الملفات لا تُحفَظ) — مفتاح ثابت واحد لكل المتصفح. */
const DRAFT_KEY = "lead-request-draft";

export type LeadDraft = {
  categoryId: string;
  areaId: string;
  description: string;
  phone: string;
};

export function readLeadDraft(): LeadDraft {
  if (typeof window === "undefined") {
    return { categoryId: "", areaId: "", description: "", phone: "" };
  }
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<LeadDraft>;
    return {
      categoryId: typeof parsed.categoryId === "string" ? parsed.categoryId : "",
      areaId: typeof parsed.areaId === "string" ? parsed.areaId : "",
      description: typeof parsed.description === "string" ? parsed.description : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
  } catch {
    return { categoryId: "", areaId: "", description: "", phone: "" };
  }
}

interface UseLeadRequestFormOptions {
  initialValues?: {
    categoryId?: string;
    areaId?: string;
  };
}

export function useLeadRequestForm(options?: UseLeadRequestFormOptions) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LeadErrors>({});
  const [selection, setSelection] = useState<LeadImageSelection>({ kept: [], files: [] });
  const [draft, setDraft] = useState<LeadDraft>(() => ({
    categoryId: options?.initialValues?.categoryId || "",
    areaId: options?.initialValues?.areaId || "",
    description: "",
    phone: "",
  }));

  // قراءة المسودة المحفوظة بعد الـ hydration لمنع أي mismatch بين الخادم والعميل
  useEffect(() => {
    const saved = readLeadDraft();
    if (saved.categoryId || saved.areaId || saved.description || saved.phone) {
      setDraft((prev) => ({
        categoryId: prev.categoryId || saved.categoryId,
        areaId: prev.areaId || saved.areaId,
        description: prev.description || saved.description,
        phone: prev.phone || saved.phone,
      }));
    }
  }, []);

  const submittingRef = useRef(false);
  const router = useRouter();

  function persistDraft(form: HTMLFormElement) {
    try {
      const data = new FormData(form);
      const draftValue: LeadDraft = {
        categoryId: String(data.get("category_id") ?? ""),
        areaId: String(data.get("area_id") ?? ""),
        description: String(data.get("description") ?? ""),
        phone: String(data.get("customer_phone") ?? ""),
      };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draftValue));
    } catch {
      // التخزين المحلي غير متاح — تجاهل بصمت.
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    const formData = new FormData(e.currentTarget);
    submittingRef.current = true;
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const tempUrls = await uploadLeadTempImages(selection.files);
      for (const url of tempUrls) formData.append("image_url", url);
      const result = await submitLead(formData);

      if (!result.success) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      } else {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          // تجاهل بصمت.
        }
        setSuccess(true);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر رفع الصور — حاول مرة أخرى");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return {
    loading,
    success,
    error,
    fieldErrors,
    selection,
    setSelection,
    draft,
    persistDraft,
    handleSubmit,
  };
}
