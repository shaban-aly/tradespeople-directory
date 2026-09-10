"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { revokeImagePreview } from "@/lib/storage/images";
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

  function handleImageChange(file: File) {
    if (objUrlRef.current) revokeImagePreview(objUrlRef.current);
    objUrlRef.current = null;
    setNewImageFile(file);
    setRemoveRequested(false);
    const url = URL.createObjectURL(file);
    objUrlRef.current = url;
    setPreviewUrl(url);
  }

  function handleImageRemove() {
    if (objUrlRef.current) revokeImagePreview(objUrlRef.current);
    objUrlRef.current = null;
    setNewImageFile(null);
    setRemoveRequested(true);
    setPreviewUrl(null);
  }

  function handleImageUndo() {
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

    try {
      await updateCraftsmanSelfProfile(initialProfile.id, {
        phone: formData.phone,
        whatsapp: formData.whatsapp || undefined,
        description: formData.description || undefined,
        areaId: formData.areaId || undefined,
        socialLinks: formData.socialLinks,
        image: newImageFile,
        removeImage: removeRequested,
        existingImageUrl: initialProfile.imageUrl,
      });

      setSuccess(true);
      if (onSaved) onSaved();
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
    success,
    handleImageChange,
    handleImageRemove,
    handleImageUndo,
    handleSubmit,
  };
}