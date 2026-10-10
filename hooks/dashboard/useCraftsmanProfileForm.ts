"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  revokeImagePreview,
  validateImage,
  convertToWebP,
} from "@/lib/storage/images";
import { revalidateProfileAfterSave } from "@/app/dashboard/actions";
import {
  type CraftsmanSelfProfile,
  type DashboardSocialLink,
} from "@/lib/db/craftsman-dashboard";
import { updateCraftsmanSelfProfile } from "@/lib/db/craftsman-mutations";

import {
  anyError,
  type FieldErrors,
  validateDescription,
  validateName,
  validatePhone,
  validateSocialLinks,
} from "@/lib/utils/validation";

export interface ProfileFormData {
  name: string;
  phone: string;
  whatsapp: string;
  description: string;
  areaId: string;
  socialLinks: DashboardSocialLink[];
}

export type ProfileFormFieldName = "name" | "phone" | "whatsapp" | "description" | "areaId";
export type ProfileFormErrors = FieldErrors<ProfileFormFieldName>;

export interface AreaOption {
  id: string;
  name: string;
}

export function useCraftsmanProfileForm(
  initialProfile: CraftsmanSelfProfile | null,
  onSaved?: () => void,
  initialAreas?: AreaOption[],
) {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: initialProfile?.name ?? "",
    phone: initialProfile?.phone ?? "",
    whatsapp: initialProfile?.whatsapp ?? "",
    description: initialProfile?.description ?? "",
    areaId: initialProfile?.areaId ?? "",
    socialLinks: initialProfile?.socialLinks ?? [],
  });
  const [touched, setTouched] = useState<Partial<Record<ProfileFormFieldName, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<ProfileFormErrors>({});
  const [socialError, setSocialError] = useState("");

  // نموذج تغيير الصورة: اختيار صورة جديدة = استبدال عند الحفظ فقط،
  // والضغط على "تراجع" يلغي الصورة الجديدة ويرجع للصورة الأصلية.
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialProfile?.imageUrl ?? null
  );
  const objUrlRef = useRef<string | null>(null);
  const [areas, setAreas] = useState<AreaOption[]>(initialAreas ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const router = useRouter();

  // تتبع حالة التغيير (Dirty State) بدقة لمقارنة المدخلات بالقيم الأصلية
  const isDirty = useMemo(() => {
    if (!initialProfile) return false;
    if (formData.name.trim() !== (initialProfile.name ?? "").trim()) return true;
    if (formData.phone.trim() !== (initialProfile.phone ?? "").trim()) return true;
    if (formData.whatsapp.trim() !== (initialProfile.whatsapp ?? "").trim()) return true;
    if (formData.description.trim() !== (initialProfile.description ?? "").trim()) return true;
    if (formData.areaId !== (initialProfile.areaId ?? "")) return true;
    if (Boolean(newImageFile)) return true;

    // مقارنة روابط التواصل الاجتماعي
    const initLinks = initialProfile.socialLinks ?? [];
    const currLinks = formData.socialLinks.filter((l) => l.url.trim() !== "");
    const initActive = initLinks.filter((l) => l.url.trim() !== "");
    if (currLinks.length !== initActive.length) return true;
    for (let i = 0; i < currLinks.length; i++) {
      if (
        currLinks[i].platform !== initActive[i]?.platform ||
        currLinks[i].url.trim() !== initActive[i]?.url.trim()
      ) {
        return true;
      }
    }
    return false;
  }, [formData, initialProfile, newImageFile]);

  // حماية الفني من فقدان البيانات غير المحفوظة عند محاولة إغلاق الصفحة أو التنقل
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // إلغاء الروابط المؤقتة عند إغلاق الفورم أو إعادة البناء
  useEffect(() => {
    return () => {
      if (objUrlRef.current) revokeImagePreview(objUrlRef.current);
    };
  }, []);

  // جلب قائمة المناطق المتاحة فقط عندما لا تُمرَّر من خارج الـ hook
  useEffect(() => {
    if (initialAreas) return;
    let mounted = true;
    void import("@/lib/db/craftsman-mutations")
      .then(({ getAreasList }) => getAreasList())
      .then((res) => {
        if (mounted) setAreas(res);
      });
    return () => {
      mounted = false;
    };
  }, [initialAreas]);

  async function handleImageChange(file: File) {
    setError(null);
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    let converted = file;
    try {
      converted = await convertToWebP(file);
    } catch {
      setError("مقدرناش نحوّل الصورة لـ WebP — جرّب صورة تانية");
      return;
    }
    if (objUrlRef.current) revokeImagePreview(objUrlRef.current);
    objUrlRef.current = null;
    setNewImageFile(converted);
    const url = URL.createObjectURL(converted);
    objUrlRef.current = url;
    setPreviewUrl(url);
  }

  const handleRevertImage = useCallback(() => {
    setError(null);
    if (objUrlRef.current) revokeImagePreview(objUrlRef.current);
    objUrlRef.current = null;
    setNewImageFile(null);
    setPreviewUrl(initialProfile?.imageUrl ?? null);
  }, [initialProfile?.imageUrl]);

  // استعادة البيانات الأصلية وإلغاء كافة التعديلات غير المحفوظة (Reset Form)
  const handleResetForm = useCallback(() => {
    if (!initialProfile) return;
    setFormData({
      name: initialProfile.name ?? "",
      phone: initialProfile.phone ?? "",
      whatsapp: initialProfile.whatsapp ?? "",
      description: initialProfile.description ?? "",
      areaId: initialProfile.areaId ?? "",
      socialLinks: initialProfile.socialLinks ? [...initialProfile.socialLinks] : [],
    });
    setTouched({});
    setFieldErrors({});
    setSocialError("");
    setError(null);
    setWarning(null);
    setSuccess(false);
    handleRevertImage();
  }, [initialProfile, handleRevertImage]);

  function validateField(field: ProfileFormFieldName, value: string): string | undefined {
    switch (field) {
      case "name":
        return validateName(value) ?? undefined;
      case "phone":
        return validatePhone(value) ?? undefined;
      case "whatsapp":
        return value.trim() ? (validatePhone(value, false) ?? undefined) : undefined;
      case "description":
        return value.trim() ? (validateDescription(value) ?? undefined) : undefined;
      case "areaId":
        return value.trim() ? undefined : "اختر المنطقة";
    }
  }

  function handleFieldChange(field: ProfileFormFieldName, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  }

  function handleFieldBlur(field: ProfileFormFieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formData[field]),
    }));
  }

  function handleSocialLinksChange(links: DashboardSocialLink[]) {
    setFormData((prev) => ({ ...prev, socialLinks: links }));
    setSocialError("");
  }

  function handleSyncPhoneToWhatsapp() {
    handleFieldChange("whatsapp", formData.phone);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initialProfile || saving) return;

    // التحقق من صحة الحقول أولاً
    const nextErrors: ProfileFormErrors = {
      name: validateName(formData.name) ?? undefined,
      phone: validatePhone(formData.phone) ?? undefined,
      whatsapp: formData.whatsapp.trim() ? (validatePhone(formData.whatsapp, false) ?? undefined) : undefined,
      description: formData.description.trim() ? (validateDescription(formData.description) ?? undefined) : undefined,
    };
    setFieldErrors(nextErrors);
    setTouched({ name: true, phone: true, whatsapp: true, description: true, areaId: true });

    if (anyError(nextErrors)) {
      setError("يرجى مراجعة وتصحيح الحقول المحددة");
      // توجيه التركيز التلقائي إلى أول حقل يحتوي على خطأ (Focus on First Error)
      const firstErrorKey = (
        ["name", "phone", "whatsapp", "areaId", "description"] as ProfileFormFieldName[]
      ).find((k) => nextErrors[k]);
      if (firstErrorKey) {
        const el =
          document.getElementById(`${firstErrorKey}-input`) ||
          document.getElementById(`${firstErrorKey}-select`) ||
          document.getElementById(`${firstErrorKey}-textarea`);
        el?.focus();
      }
      return;
    }

    const activeLinks = formData.socialLinks.filter((l) => l.url.trim() !== "");
    const linksError = validateSocialLinks(activeLinks);
    setSocialError(linksError ?? "");
    if (linksError) {
      setError(linksError);
      return;
    }

    // الصورة إجبارية في الدليل: ممنوع الحفظ وحساب الصنايعي من غير صورة.
    const willHaveImage =
      newImageFile !== null || initialProfile.imageUrl !== null;
    if (!willHaveImage) {
      setError("ما ينفعش تعمل حفظ من غير صورة — الصورة مطلوبة لكل صنايعي في الدليل.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    setWarning(null);

    try {
      const result = await updateCraftsmanSelfProfile(initialProfile.id, {
        name: formData.name.trim(),
        phone: formData.phone,
        whatsapp: formData.whatsapp || undefined,
        description: formData.description || undefined,
        areaId: formData.areaId || undefined,
        socialLinks: formData.socialLinks,
        image: newImageFile,
        existingImageUrl: initialProfile.imageUrl,
      });

      if (result.warning) setWarning(result.warning);

      setSuccess(true);
      if (onSaved) onSaved();
      // إبطال كاش الموقع العام حتى تظهر التعديلات فوراً في الصفحة العامة
      try {
        await revalidateProfileAfterSave();
      } catch {
        // فشل إبطال الكاش لا يمنع إتمام الحفظ
      }
      // تحديث بيانات صفحة السيرفر (الهيدر) بعد الحفظ
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ البيانات");
    } finally {
      setSaving(false);
    }
  }

  return {
    formData,
    setFormData,
    handleFieldChange,
    handleFieldBlur,
    handleSocialLinksChange,
    handleSyncPhoneToWhatsapp,
    handleResetForm,
    fieldErrors,
    touched,
    getFieldError: (field: ProfileFormFieldName) => (touched[field] ? fieldErrors[field] : undefined),
    socialError,
    areas,
    previewUrl,
    hasNewImage: Boolean(newImageFile),
    isDirty,
    saving,
    error,
    warning,
    success,
    handleImageChange,
    handleRevertImage,
    handleSubmit,
  };
}