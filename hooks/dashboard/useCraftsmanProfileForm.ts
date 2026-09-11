"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  revokeImagePreview,
  validateImage,
  convertToWebP,
} from "@/lib/storage/images";
import { revalidateProfileAfterSave } from "@/app/dashboard/actions";
import {
  updateCraftsmanSelfProfile,
  type CraftsmanSelfProfile,
  type DashboardSocialLink,
} from "@/lib/db/craftsman-dashboard";

export interface ProfileFormData {
  phone: string;
  whatsapp: string;
  description: string;
  areaId: string;
  socialLinks: DashboardSocialLink[];
}

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
    phone: initialProfile?.phone ?? "",
    whatsapp: initialProfile?.whatsapp ?? "",
    description: initialProfile?.description ?? "",
    areaId: initialProfile?.areaId ?? "",
    socialLinks: initialProfile?.socialLinks ?? [],
  });

  // نموذج الحذف المؤجل: اختيار صورة جديدة = استبدال عند الحفظ فقط،
  // والضغط على "حذف" بيجيل الحذف (removeRequested) من غير ما يلمس
  // الصورة الفعلية في Supabase/Storage لحد ما المستخدم يحفظ.
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);
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

  // عند تغير البروفايل (بعد الحفظ والريفريش) بيعمل page.tsx إعادة بناء
  // للكومبوننت عبر `key` (نفس صورة البروفايل) فلا نحتاج مزامنة في useEffect.
  // إلغاء الروابط المؤقتة عند إغلاق الفورم أو إعادة البناء
  useEffect(() => {
    return () => {
      if (objUrlRef.current) revokeImagePreview(objUrlRef.current);
    };
  }, []);

  // جلب قائمة المناطق المتاحة فقط عندما لا تُمرَّر من خارج الـ hook
  // (الوضع الجديد: تُمرَّر من صفحة السيرفر بدل جلبها من المتصفح)
  useEffect(() => {
    if (initialAreas) return;
    let mounted = true;
    void import("@/lib/db/craftsman-dashboard")
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
    setRemoveRequested(false);
    const url = URL.createObjectURL(converted);
    objUrlRef.current = url;
    setPreviewUrl(url);
  }

  function handleImageRemove() {
    setError(null);
    if (objUrlRef.current) revokeImagePreview(objUrlRef.current);
    objUrlRef.current = null;
    setNewImageFile(null);
    setRemoveRequested(true);
    setPreviewUrl(null);
  }

  function handleImageUndo() {
    setError(null);
    if (objUrlRef.current) revokeImagePreview(objUrlRef.current);
    objUrlRef.current = null;
    setNewImageFile(null);
    setRemoveRequested(false);
    setPreviewUrl(initialProfile?.imageUrl ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initialProfile) return;

    // الصورة إجبارية في الدليل: ممنوع الحفظ وحساب الصنايعي من غير صورة.
    const willHaveImage =
      newImageFile !== null ||
      (initialProfile.imageUrl !== null && !removeRequested);
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
        phone: formData.phone,
        whatsapp: formData.whatsapp || undefined,
        description: formData.description || undefined,
        areaId: formData.areaId || undefined,
        socialLinks: formData.socialLinks,
        image: newImageFile,
        removeImage: removeRequested,
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
    areas,
    previewUrl,
    removeRequested,
    saving,
    error,
    warning,
    success,
    handleImageChange,
    handleImageRemove,
    handleImageUndo,
    handleSubmit,
  };
}