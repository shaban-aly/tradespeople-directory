"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  useCraftsmanProfileForm,
  type AreaOption,
} from "@/hooks/dashboard/useCraftsmanProfileForm";
import { SocialLinksEditor } from "@/components/shared/ui/SocialLinksEditor";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { Button } from "@/components/shared/ui/Button";
import { IconCamera, IconCheck, IconSave, IconTrash, IconUndo } from "@/components/shared/icons";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage/images";

interface ProfileEditFormProps {
  profile: CraftsmanSelfProfile;
  onSaved?: () => void;
  initialAreas?: AreaOption[];
}

export function ProfileEditForm({ profile, onSaved, initialAreas }: ProfileEditFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
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

      {/* قسم الصورة الشخصية */}
      <section className="flex flex-col items-center gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-border sm:h-28 sm:w-28">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={profile.name}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              className="object-cover"
            />
          ) : (
            <CraftsmanAvatar
              name={profile.name}
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
              if (file) void handleImageChange(file);
            }}
          />

          <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
            {previewUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-base font-semibold text-foreground transition-colors hover:bg-card active:scale-98"
                >
                  <IconCamera className="h-5 w-5" />
                  <span>تغيير الصورة</span>
                </button>
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-base font-medium text-red-500 hover:bg-red-500/10 active:scale-98"
                >
                  <IconTrash className="h-5 w-5" />
                  <span>حذف</span>
                </button>
              </>
            ) : removeRequested ? (
              <>
                <button
                  type="button"
                  onClick={handleImageUndo}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-base font-semibold text-foreground transition-colors hover:bg-card active:scale-98"
                >
                  <IconUndo className="h-5 w-5" />
                  <span>تراجع عن الحذف</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-base font-medium text-foreground hover:bg-card active:scale-98"
                >
                  <IconCamera className="h-5 w-5" />
                  <span>رفع صورة جديدة</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-base font-semibold text-foreground transition-colors hover:bg-card active:scale-98"
              >
                <IconCamera className="h-5 w-5" />
                <span>رفع صورة</span>
              </button>
            )}
          </div>

          {removeRequested && (
            <p
              role="alert"
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-600"
            >
              <IconTrash className="h-4 w-4 shrink-0" />
              <span>سيتم حذف الصورة نهائياً من الدليل عند حفظ التعديلات.</span>
            </p>
          )}
        </div>
      </section>

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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="01012345678"
            className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none"
            dir="ltr"
          />
          <p className="mt-1 text-xs text-muted">
            الرقم الذي سيتصل به العميل مباشرة
          </p>
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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
            }
            placeholder="اتركه فارغاً إذا كان نفس رقم الاتصال"
            className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none"
            dir="ltr"
          />
          <p className="mt-1 text-xs text-muted">
            إذا اختلف عن رقم الاتصال المباشر
          </p>
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
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, areaId: e.target.value }))
          }
          className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none"
        >
          <option value="">اختر المنطقة...</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      {/* النبذة المهنية والخدمات */}
      <div>
        <label
          htmlFor="description-textarea"
          className="mb-1.5 block text-sm font-bold text-foreground"
        >
          نبذة عن خدماتك وخبرتك
        </label>
        <textarea
          id="description-textarea"
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="اكتب هنا التخصصات اللي بتشتغل فيها بدقة، سنوات خبرتك، وأي خدمات إضافية بتقدمها لأهل السويس..."
          className="w-full rounded-xl border border-border bg-background p-4 text-base text-foreground transition-colors focus:outline-none resize-y"
        />
        <p className="mt-1 text-xs text-muted">
          الوصف الواضح والمهني يساعد العميل على فهم شغلك واختيارك
        </p>
      </div>

      {/* روابط السوشيال ميديا */}
      <SocialLinksEditor
        links={formData.socialLinks}
        onChange={(links) =>
          setFormData((prev) => ({ ...prev, socialLinks: links }))
        }
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
    </form>
  );
}
