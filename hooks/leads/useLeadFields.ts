"use client";

import { useEffect, useRef, useState } from "react";

export interface LeadFieldsDefaultValues {
  categoryId?: string;
  areaId?: string;
  description?: string;
  phone?: string;
}

export interface UseLeadFieldsOptions {
  defaultValues?: LeadFieldsDefaultValues;
  onDraftChange?: () => void;
}

/**
 * هوك إدارة حالة ومنطق حقول طلب الفني (LeadFields).
 * يفصل المنطق، والمزامنة مع المسودة، وحساب طول الوصف، وإشعار الحفظ
 * عن مكوّن العرض (UI).
 */
export function useLeadFields({
  defaultValues = {},
  onDraftChange,
}: UseLeadFieldsOptions = {}) {
  const [categoryId, setCategoryId] = useState(defaultValues.categoryId ?? "");
  const [areaId, setAreaId] = useState(defaultValues.areaId ?? "");
  const [description, setDescription] = useState(defaultValues.description ?? "");
  const [phone, setPhone] = useState(defaultValues.phone ?? "");

  const containerRef = useRef<HTMLDivElement>(null);
  const prevDefaultsRef = useRef(defaultValues);

  // مزامنة القيم عند تحديث defaultValues (مثل تحميل المسودة بعد الـ hydration أو فتح نافذة التعديل)
  useEffect(() => {
    const prev = prevDefaultsRef.current;
    if (defaultValues.categoryId !== undefined && defaultValues.categoryId !== prev.categoryId) {
      setCategoryId(defaultValues.categoryId);
    }
    if (defaultValues.areaId !== undefined && defaultValues.areaId !== prev.areaId) {
      setAreaId(defaultValues.areaId);
    }
    if (defaultValues.description !== undefined && defaultValues.description !== prev.description) {
      setDescription(defaultValues.description);
    }
    if (defaultValues.phone !== undefined && defaultValues.phone !== prev.phone) {
      setPhone(defaultValues.phone);
    }
    prevDefaultsRef.current = defaultValues;
  }, [
    defaultValues.categoryId,
    defaultValues.areaId,
    defaultValues.description,
    defaultValues.phone,
  ]);

  function notifyDraftChange() {
    onDraftChange?.();
    if (containerRef.current) {
      const form = containerRef.current.closest("form");
      if (form) {
        form.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function handleCategoryChange(nextId: string) {
    setCategoryId(nextId);
    setTimeout(notifyDraftChange, 0);
  }

  function handleAreaChange(nextId: string) {
    setAreaId(nextId);
    setTimeout(notifyDraftChange, 0);
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);
    notifyDraftChange();
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    notifyDraftChange();
  }

  const descLength = description.length;

  return {
    categoryId,
    areaId,
    description,
    phone,
    descLength,
    containerRef,
    handleCategoryChange,
    handleAreaChange,
    handleDescriptionChange,
    handlePhoneChange,
  };
}
