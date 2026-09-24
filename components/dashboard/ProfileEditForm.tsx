"use client";

import { useCallback, useRef, useState, startTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCraftsmanProfileForm,
  type AreaOption,
} from "@/hooks/dashboard/useCraftsmanProfileForm";
import { SocialLinksEditor } from "@/components/shared/ui/SocialLinksEditor";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { ImageViewer } from "@/components/shared/ui/ImageViewer";
import { Button } from "@/components/shared/ui/Button";
import {
  IconCamera,
  IconCheck,
  IconCrop,
  IconMaximize,
  IconSave,
  IconUndo,
} from "@/components/shared/icons";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";
import type { AvatarPosition } from "@/lib/data/craftsmen";
import { ACCEPTED_IMAGE_TYPES, validateImage } from "@/lib/storage/images";
import { ImagePositionEditor } from "@/components/dashboard/ImagePositionEditor";

interface ProfileEditFormProps {
  profile: CraftsmanSelfProfile;
  onSaved?: () => void;
  initialAreas?: AreaOption[];
}

export function ProfileEditForm({ profile, onSaved, initialAreas }: ProfileEditFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    profile.imageUrl ?? null,
  );
  const [currentAvatarPos, setCurrentAvatarPos] = useState<AvatarPosition | null>(
    profile.avatarPosition ?? null,
  );
  const [selectedNewFile, setSelectedNewFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleFilePicked = (file: File) => {
    setAvatarError(null);
    const validationErr = validateImage(file);
    if (validationErr) {
      setAvatarError(validationErr);
      return;
    }
    setSelectedNewFile(file);
    setIsPositionEditorOpen(true);
  };
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const isUrlViewerOpen = searchParams?.get("image") === "view";
  const showViewer = isViewerOpen || isUrlViewerOpen;

  const handleOpenViewer = useCallback(() => {
    const current = new URLSearchParams(searchParams ? searchParams.toString() : "");
    current.set("image", "view");
    const search = current.toString();
    const query = search ? `?${search}` : "";
    startTransition(() => {
      router.push(`${pathname}${query}`, { scroll: false });
    });
    setIsViewerOpen(true);
  }, [pathname, router, searchParams]);

  const handleCloseViewer = useCallback(() => {
    setIsViewerOpen(false);
    if (searchParams?.get("image") === "view") {
      const current = new URLSearchParams(searchParams.toString());
      current.delete("image");
      const search = current.toString();
      const query = search ? `?${search}` : "";
      startTransition(() => {
        router.push(`${pathname}${query}`, { scroll: false });
      });
    }
  }, [pathname, router, searchParams]);
  const {
    formData,
    handleFieldChange,
    handleFieldBlur,
    handleSocialLinksChange,
    getFieldError,
    socialError,
    areas,
    previewUrl,
    hasNewImage,
    saving,
    error,
    warning,
    success,
    handleImageChange,
    handleRevertImage,
    handleSubmit,
  } = useCraftsmanProfileForm(profile, onSaved, initialAreas);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6"
    >
      {/* رسائل النجاح أو الخطأ */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-600"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-action/30 bg-action/10 p-4 text-sm font-semibold text-action"
        >
          <IconCheck className="h-5 w-5 shrink-0" />
          <span>تم حفظ بياناتك وتحديثها بنجاح في الدليل!</span>
        </div>
      )}

      {warning && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-600"
        >
          {warning}
        </div>
      )}

      {avatarError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600"
        >
          {avatarError}
        </div>
      )}

      {/* قسم الصورة الشخصية */}
      <section className="flex flex-col items-center gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:gap-6">
        <div
          onClick={() => {
            if (currentAvatarUrl) handleOpenViewer();
          }}
          className={`group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-border sm:h-28 sm:w-28 ${
            currentAvatarUrl ? "cursor-pointer transition-transform hover:scale-102 focus-visible:ring-2 focus-visible:ring-accent" : ""
          }`}
          title={currentAvatarUrl ? "اضغط لمعاينة الصورة بحجم كامل" : undefined}
          role={currentAvatarUrl ? "button" : undefined}
          tabIndex={currentAvatarUrl ? 0 : undefined}
          onKeyDown={(e) => {
            if (currentAvatarUrl && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleOpenViewer();
            }
          }}
        >
          {currentAvatarUrl ? (
            <>
              <Image
                src={currentAvatarUrl}
                alt={profile.name}
                fill
                sizes="(max-width: 640px) 96px, 112px"
                className="object-cover"
                style={{
                  objectPosition: `${currentAvatarPos?.x ?? 50}% ${currentAvatarPos?.y ?? 50}%`,
                  transform:
                    (currentAvatarPos?.zoom ?? 1) > 1
                      ? `scale(${currentAvatarPos?.zoom})`
                      : undefined,
                  transformOrigin: `${currentAvatarPos?.x ?? 50}% ${currentAvatarPos?.y ?? 50}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <IconMaximize className="h-6 w-6 text-white" />
              </div>
            </>
          ) : (
            <CraftsmanAvatar
              name={formData.name || profile.name}
              className="h-full w-full rounded-2xl text-2xl"
            />
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-right">
          <p className="text-base font-bold text-foreground">
            صورة البروفايل أو العمل
          </p>
          <p className="text-xs text-muted max-w-xs">
            صورة واضحة ليك في ورشتك أو لشغلك بتزود اتصالات العملاء بنسبة 40%
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFilePicked(file);
              e.target.value = "";
            }}
          />

          <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-base font-semibold text-foreground transition-colors hover:bg-card active:scale-98"
            >
              <IconCamera className="h-5 w-5" />
              <span>{currentAvatarUrl ? "تغيير الصورة" : "رفع صورة"}</span>
            </button>

            {currentAvatarUrl && (
              <button
                type="button"
                onClick={() => {
                  setSelectedNewFile(null);
                  setIsPositionEditorOpen((prev) => !prev);
                }}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-base font-semibold transition-all active:scale-98 ${
                  isPositionEditorOpen && !selectedNewFile
                    ? "border-accent bg-accent text-white"
                    : "border-border text-foreground hover:bg-card"
                }`}
                title="تنسيق وتوسيط إطار الصورة"
              >
                <IconCrop className="h-4 w-4" />
                <span>تنسيق الصورة</span>
              </button>
            )}

            {currentAvatarUrl && (
              <button
                type="button"
                onClick={handleOpenViewer}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-base font-medium text-muted hover:bg-card hover:text-foreground active:scale-98"
                title="معاينة وتكبير الصورة بحجم كامل"
              >
                <IconMaximize className="h-5 w-5" />
                <span>معاينة مكبرة</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* محرر تنسيق وبؤرة الصورة (سواء لصورة جديدة تم اختيارها أو للصورة الحالية) */}
      {isPositionEditorOpen && (selectedNewFile || currentAvatarUrl) && (
        <section className="border-b border-border pb-6 animate-in fade-in duration-200">
          <ImagePositionEditor
            craftsmanId={profile.id}
            slug={profile.slug}
            imageFile={selectedNewFile}
            imageUrl={currentAvatarUrl}
            initialPosition={currentAvatarPos}
            onSaved={(result) => {
              setCurrentAvatarUrl(result.imageUrl);
              setCurrentAvatarPos(result.position);
              setSelectedNewFile(null);
              setIsPositionEditorOpen(false);
            }}
            onClose={() => {
              setSelectedNewFile(null);
              setIsPositionEditorOpen(false);
            }}
          />
        </section>
      )}

      {/* اسم الصنايعي */}
      <div>
        <label
          htmlFor="name-input"
          className="mb-1.5 block text-sm font-bold text-foreground"
        >
          اسمك الكامل أو التجاري *
        </label>
        <input
          id="name-input"
          type="text"
          required
          maxLength={60}
          value={formData.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          onBlur={() => handleFieldBlur("name")}
          placeholder="مثال: أحمد عبد الله"
          className={`min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none ${
            getFieldError("name") ? "border-danger focus:border-danger" : "border-border"
          }`}
        />
        {getFieldError("name") ? (
          <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("name")}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            الاسم الذي سيظهر للعملاء في الدليل وعند البحث
          </p>
        )}
      </div>

      {/* أرقام التواصل (موبايل وواتساب) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone-input"
            className="mb-1.5 block text-sm font-bold text-foreground"
          >
            رقم الهاتف الأساسي (للاتصال المباشر) *
          </label>
          <input
            id="phone-input"
            type="tel"
            inputMode="tel"
            required
            value={formData.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            onBlur={() => handleFieldBlur("phone")}
            placeholder="01012345678"
            className={`min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none ${
              getFieldError("phone") ? "border-danger focus:border-danger" : "border-border"
            }`}
            dir="ltr"
          />
          {getFieldError("phone") ? (
            <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("phone")}</p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              الرقم الذي سيتصل به العميل مباشرة
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="whatsapp-input"
            className="mb-1.5 block text-sm font-bold text-foreground"
          >
            رقم الواتساب (اختياري)
          </label>
          <input
            id="whatsapp-input"
            type="tel"
            inputMode="tel"
            value={formData.whatsapp}
            onChange={(e) => handleFieldChange("whatsapp", e.target.value)}
            onBlur={() => handleFieldBlur("whatsapp")}
            placeholder="اتركه فارغاً إذا كان نفس رقم الاتصال"
            className={`min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none ${
              getFieldError("whatsapp") ? "border-danger focus:border-danger" : "border-border"
            }`}
            dir="ltr"
          />
          {getFieldError("whatsapp") ? (
            <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("whatsapp")}</p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              إذا اختلف عن رقم الاتصال المباشر
            </p>
          )}
        </div>
      </div>

      {/* المنطقة */}
      <div>
        <label
          htmlFor="area-select"
          className="mb-1.5 block text-sm font-bold text-foreground"
        >
          منطقة أو حي العمل في السويس
        </label>
        <select
          id="area-select"
          value={formData.areaId}
          onChange={(e) => handleFieldChange("areaId", e.target.value)}
          onBlur={() => handleFieldBlur("areaId")}
          className={`min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none ${
            getFieldError("areaId") ? "border-danger focus:border-danger" : "border-border"
          }`}
        >
          <option value="">اختر المنطقة...</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        {getFieldError("areaId") && (
          <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("areaId")}</p>
        )}
      </div>

      {/* النبذة المهنية والخدمات */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="description-textarea"
            className="text-sm font-bold text-foreground"
          >
            نبذة عن خدماتك وخبرتك
          </label>
          <span className="text-xs text-muted">
            {formData.description.length}/1000
          </span>
        </div>
        <textarea
          id="description-textarea"
          rows={4}
          maxLength={1000}
          value={formData.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          onBlur={() => handleFieldBlur("description")}
          placeholder="اكتب هنا التخصصات اللي بتشتغل فيها بدقة، سنوات خبرتك، وأي خدمات إضافية بتقدمها لأهل السويس..."
          className={`w-full rounded-xl border bg-background p-4 text-base text-foreground transition-colors focus:outline-none resize-y ${
            getFieldError("description") ? "border-danger focus:border-danger" : "border-border"
          }`}
        />
        {getFieldError("description") ? (
          <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("description")}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            الوصف الواضح والمهني يساعد العميل على فهم شغلك واختيارك
          </p>
        )}
      </div>

      {/* روابط السوشيال ميديا */}
      <SocialLinksEditor
        links={formData.socialLinks}
        onChange={handleSocialLinksChange}
        error={socialError}
      />

      {/* زر الحفظ الكبير والمريح على الموبايل */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="action"
          disabled={saving}
          className="min-h-12 w-full text-base font-bold justify-center"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>جاري حفظ التعديلات...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <IconSave className="h-5 w-5" />
              <span>حفظ التعديلات</span>
            </span>
          )}
        </Button>
      </div>

      {previewUrl && (
        <ImageViewer
          open={showViewer}
          onClose={handleCloseViewer}
          src={previewUrl}
          title={formData.name || profile.name}
        />
      )}
    </form>
  );
}
