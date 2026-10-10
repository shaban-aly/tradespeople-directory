"use client";

import { useEffect, useRef } from "react";
import {
  useCraftsmanProfileForm,
  type AreaOption,
} from "@/hooks/dashboard/useCraftsmanProfileForm";
import { ProfileContactSection } from "@/components/dashboard/profile/ProfileContactSection";
import { ProfileBioSection } from "@/components/dashboard/profile/ProfileBioSection";
import { ProfileSocialSection } from "@/components/dashboard/profile/ProfileSocialSection";
import { Button } from "@/components/shared/ui/Button";
import { IconCheck, IconSave } from "@/components/shared/icons";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

interface ProfileEditFormProps {
  profile: CraftsmanSelfProfile;
  onSaved?: () => void;
  initialAreas?: AreaOption[];
}

export function ProfileEditForm({
  profile,
  onSaved,
  initialAreas,
}: ProfileEditFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const {
    formData,
    handleFieldChange,
    handleFieldBlur,
    handleSocialLinksChange,
    handleSyncPhoneToWhatsapp,
    handleResetForm,
    getFieldError,
    socialError,
    areas,
    isDirty,
    saving,
    error,
    warning,
    success,
    handleSubmit,
  } = useCraftsmanProfileForm(profile, onSaved, initialAreas);

  // اختصار لوحة المفاتيح Ctrl+S أو Cmd+S للحفظ السريع (Alex Persona Accelerator)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving && isDirty) {
          formRef.current?.requestSubmit();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saving, isDirty]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* رسائل التنبيه والنجاح */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-600 shadow-sm"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-action/30 bg-action/10 p-4 text-sm font-bold text-action shadow-sm"
        >
          <IconCheck className="h-5 w-5 shrink-0" />
          <span>تم حفظ بياناتك وتحديثها بنجاح في الدليل!</span>
        </div>
      )}

      {warning && (
        <div
          role="status"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-bold text-amber-600 shadow-sm"
        >
          {warning}
        </div>
      )}

      {/* قسم البيانات الأساسية وأرقام التواصل والمنطقة */}
      <ProfileContactSection
        name={formData.name}
        phone={formData.phone}
        whatsapp={formData.whatsapp}
        areaId={formData.areaId}
        areas={areas}
        getFieldError={getFieldError}
        onFieldChange={handleFieldChange}
        onFieldBlur={handleFieldBlur}
        onSyncPhoneToWhatsapp={handleSyncPhoneToWhatsapp}
      />

      {/* قسم النبذة المهنية والخدمات */}
      <ProfileBioSection
        description={formData.description}
        getFieldError={getFieldError}
        onFieldChange={handleFieldChange}
        onFieldBlur={handleFieldBlur}
      />

      {/* قسم روابط التواصل الاجتماعي */}
      <ProfileSocialSection
        socialLinks={formData.socialLinks}
        error={socialError}
        onChange={handleSocialLinksChange}
      />

      {/* شريط الإجراءات وحفظ التعديلات مع مؤشر التعديلات الحية وزر التراجع */}
      <div className="sticky bottom-4 z-20 rounded-2xl border border-border/80 bg-card/95 p-3 sm:p-4 shadow-card backdrop-blur-md">
        {isDirty ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>توجد تعديلات غير محفوظة</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={saving}
                className="min-h-12 px-4 rounded-xl border border-border/80 bg-background text-xs sm:text-sm font-bold text-muted hover:text-foreground hover:bg-muted/10 transition-colors active:scale-98 disabled:opacity-50"
              >
                تراجع عن التعديلات
              </button>

              <Button
                type="submit"
                variant="action"
                disabled={saving}
                className="flex-1 sm:flex-initial min-h-12 px-6 text-base font-bold justify-center shadow-sm"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>جاري الحفظ...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <IconSave className="h-5 w-5" />
                    <span>حفظ جميع التعديلات</span>
                    <span className="hidden sm:inline text-xs opacity-75 font-normal">(Ctrl+S)</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted">
              كافة البيانات متطابقة مع المحفوظات
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={true}
              className="min-h-12 px-6 text-sm font-bold opacity-60 cursor-not-allowed justify-center"
            >
              البيانات محفوظة ومحدثة
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
