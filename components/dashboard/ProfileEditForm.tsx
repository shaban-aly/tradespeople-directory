"use client";

import { useCraftsmanProfileForm, type AreaOption } from "@/hooks/dashboard/useCraftsmanProfileForm";
import { useProfileAvatarEditor } from "@/hooks/dashboard/useProfileAvatarEditor";
import { ProfileAvatarSection } from "@/components/dashboard/profile/ProfileAvatarSection";
import { ProfileContactSection } from "@/components/dashboard/profile/ProfileContactSection";
import { ProfileBioSection } from "@/components/dashboard/profile/ProfileBioSection";
import { ProfileSocialSection } from "@/components/dashboard/profile/ProfileSocialSection";
import { ImageViewer } from "@/components/shared/ui/ImageViewer";
import { Button } from "@/components/shared/ui/Button";
import { IconCheck, IconSave } from "@/components/shared/icons";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

interface ProfileEditFormProps {
  profile: CraftsmanSelfProfile;
  onSaved?: () => void;
  initialAreas?: AreaOption[];
}

export function ProfileEditForm({ profile, onSaved, initialAreas }: ProfileEditFormProps) {
  const {
    fileInputRef,
    currentAvatarUrl,
    currentAvatarPos,
    selectedNewFile,
    avatarError,
    isPositionEditorOpen,
    showViewer,
    handleFilePicked,
    handleOpenViewer,
    handleCloseViewer,
    openPositionEditor,
    handlePositionSaved,
    handlePositionClosed,
  } = useProfileAvatarEditor(profile);

  const {
    formData,
    handleFieldChange,
    handleFieldBlur,
    handleSocialLinksChange,
    getFieldError,
    socialError,
    areas,
    previewUrl,
    saving,
    error,
    warning,
    success,
    handleSubmit,
  } = useCraftsmanProfileForm(profile, onSaved, initialAreas);

  const activeViewerSrc = previewUrl || currentAvatarUrl;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
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

      {/* قسم الصورة الشخصية وإعدادات الموضع */}
      <ProfileAvatarSection
        profile={profile}
        name={formData.name}
        fileInputRef={fileInputRef}
        currentAvatarUrl={currentAvatarUrl}
        currentAvatarPos={currentAvatarPos}
        selectedNewFile={selectedNewFile}
        avatarError={avatarError}
        isPositionEditorOpen={isPositionEditorOpen}
        onFilePicked={handleFilePicked}
        onOpenViewer={handleOpenViewer}
        onTogglePositionEditor={openPositionEditor}
        onPositionSaved={handlePositionSaved}
        onPositionClosed={handlePositionClosed}
      />

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

      {/* شريط الإجراءات وحفظ التعديلات */}
      <div className="sticky bottom-4 z-20 rounded-2xl border border-border/80 bg-card/95 p-3 sm:p-4 shadow-card backdrop-blur-md">
        <Button
          type="submit"
          variant="action"
          disabled={saving}
          className="min-h-12 w-full text-base font-bold justify-center shadow-sm"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>جاري حفظ التعديلات...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <IconSave className="h-5 w-5" />
              <span>حفظ جميع التعديلات</span>
            </span>
          )}
        </Button>
      </div>

      {/* عارض الصور للشاشة الكاملة */}
      {activeViewerSrc && (
        <ImageViewer
          open={showViewer}
          onClose={handleCloseViewer}
          src={activeViewerSrc}
          title={formData.name || profile.name}
        />
      )}
    </form>
  );
}
