"use client";

import { useState } from "react";
import { IconCamera, IconX } from "@/components/shared/icons";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import {
  type AreaRow,
  type CategoryRow,
  type CraftsmanInput,
  type CraftsmanRow,
  type SocialLinkRow,
} from "@/hooks/admin/useAdminDashboard";
import { useImageUpload } from "@/hooks/forms/useImageUpload";
import { SocialLinksEditor } from "@/components/shared/ui/SocialLinksEditor";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "@/lib/storage/images";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import { TextArea } from "@/components/shared/form/TextArea";
import { SelectField } from "@/components/shared/form/SelectField";
import {
  anyError,
  type CraftsmanErrors,
  FIELD_LIMITS,
  validateCraftsmanFields,
  validateDescription,
  validateName,
  validatePhone,
  validateRequiredChoice,
  validateSlug,
  validateSocialLinks,
} from "@/lib/utils/validation";

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

type FieldName =
  | "name"
  | "slug"
  | "categoryId"
  | "areaId"
  | "phone"
  | "whatsapp"
  | "description";

function validateSingleField(field: FieldName, value: string): string | undefined {
  switch (field) {
    case "name":
      return validateName(value) ?? undefined;
    case "slug":
      return validateSlug(value) ?? undefined;
    case "categoryId":
      return validateRequiredChoice(value, "اختر التخصص") ?? undefined;
    case "areaId":
      return validateRequiredChoice(value, "اختر المنطقة") ?? undefined;
    case "phone":
      return validatePhone(value) ?? undefined;
    case "whatsapp":
      return validatePhone(value, false) ?? undefined;
    case "description":
      return validateDescription(value) ?? undefined;
  }
}

export function CraftsmanForm({
  categories,
  areas,
  initial,
  busy,
  onSubmit,
}: {
  categories: CategoryRow[];
  areas: AreaRow[];
  initial?: CraftsmanRow | null;
  busy: boolean;
  onSubmit: (payload: CraftsmanInput) => Promise<boolean> | boolean;
}) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [areaId, setAreaId] = useState(initial?.area_id ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [verified, setVerified] = useState(initial?.verified ?? false);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [errors, setErrors] = useState<CraftsmanErrors>({});
  const {
    file,
    preview,
    error: imageError,
    selectFile,
    removeImage,
  } = useImageUpload();
  const [socialLinks, setSocialLinks] = useState<SocialLinkRow[]>(
    initial?.socialLinks?.map((link) => ({ platform: link.platform, url: link.url })) ??
      [],
  );
  const [socialError, setSocialError] = useState("");

  function handleSocialLinksChange(links: SocialLinkRow[]) {
    setSocialLinks(links);
    setSocialError("");
  }

  function activeSocialLinks(): SocialLinkRow[] {
    return socialLinks.filter((link) => link.url.trim() !== "");
  }

  function currentValues(): Record<FieldName, string> {
    return { name, slug, categoryId, areaId, phone, whatsapp, description };
  }

  function getError(field: FieldName): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  function touchField(field: FieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateSingleField(field, currentValues()[field]),
    }));
  }

  function handleChange(field: FieldName, value: string) {
    if (field === "name") setName(value);
    else if (field === "slug") setSlug(value);
    else if (field === "categoryId") setCategoryId(value);
    else if (field === "areaId") setAreaId(value);
    else if (field === "phone") setPhone(value);
    else if (field === "whatsapp") setWhatsapp(value);
    else if (field === "description") setDescription(value);

    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateSingleField(field, value),
      }));
    }
  }

  function handleCategoryChange(next: string) {
    handleChange("categoryId", next);
    if (!isEdit && slug === "") {
      const category = categories.find((item) => item.id === next);
      if (category) {
        setSlug(
          `${category.slug}-${Math.random().toString(36).slice(2, 8)}`,
        );
      }
    }
  }

  const existingImage =
    initial?.image_url && !removeExisting ? initial.image_url : null;
  const shownPreview = preview || existingImage;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateCraftsmanFields({
      name,
      slug,
      categoryId,
      areaId,
      phone,
      whatsapp,
      description,
    });
    setErrors(nextErrors);
    setTouched({
      name: true,
      slug: true,
      categoryId: true,
      areaId: true,
      phone: true,
      whatsapp: true,
      description: true,
    });
    if (anyError(nextErrors)) return;

    const activeLinks = activeSocialLinks();
    const linksError = validateSocialLinks(activeLinks);
    setSocialError(linksError ?? "");
    if (linksError) return;

    await onSubmit({
      slug: slug.trim(),
      name: name.trim(),
      category_id: categoryId,
      area_id: areaId,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || null,
      description: description.trim() || null,
      verified,
      is_published: isPublished,
      image: file,
      existingImageUrl: removeExisting ? null : initial?.image_url ?? null,
      socialLinks: activeLinks,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="اسم الصنايعي"
          htmlFor="craftsman-name"
          required
          error={getError("name")}
        >
          <TextField
            id="craftsman-name"
            required
            maxLength={FIELD_LIMITS.nameMax}
            value={name}
            invalid={Boolean(getError("name"))}
            aria-describedby={getError("name") ? fieldErrorId("craftsman-name") : undefined}
            onChange={(event) => handleChange("name", event.target.value)}
            onBlur={() => touchField("name")}
            placeholder="مثال: عم محمود عبد الرحمن"
            className={inputClass}
          />
        </Field>
        <Field
          label="الرابط (slug)"
          htmlFor="craftsman-slug"
          required
          error={getError("slug")}
        >
          <TextField
            id="craftsman-slug"
            required
            dir="ltr"
            maxLength={FIELD_LIMITS.slugMax}
            value={slug}
            invalid={Boolean(getError("slug"))}
            aria-describedby={getError("slug") ? fieldErrorId("craftsman-slug") : undefined}
            onChange={(event) => handleChange("slug", event.target.value)}
            onBlur={() => touchField("slug")}
            placeholder="plumbing-1234"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="التخصص"
          htmlFor="craftsman-category"
          required
          error={getError("categoryId")}
        >
          <SelectField
            id="craftsman-category"
            required
            value={categoryId}
            invalid={Boolean(getError("categoryId"))}
            aria-describedby={
              getError("categoryId") ? fieldErrorId("craftsman-category") : undefined
            }
            onChange={(event) => handleCategoryChange(event.target.value)}
            onBlur={() => touchField("categoryId")}
            className={inputClass}
          >
            <option value="">اختر التخصص...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field
          label="المنطقة"
          htmlFor="craftsman-area"
          required
          error={getError("areaId")}
        >
          <SelectField
            id="craftsman-area"
            required
            value={areaId}
            invalid={Boolean(getError("areaId"))}
            aria-describedby={
              getError("areaId") ? fieldErrorId("craftsman-area") : undefined
            }
            onChange={(event) => handleChange("areaId", event.target.value)}
            onBlur={() => touchField("areaId")}
            className={inputClass}
          >
            <option value="">اختر المنطقة...</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </SelectField>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="رقم الهاتف"
          htmlFor="craftsman-phone"
          required
          error={getError("phone")}
        >
          <TextField
            id="craftsman-phone"
            required
            dir="ltr"
            type="tel"
            inputMode="tel"
            maxLength={FIELD_LIMITS.phoneMax}
            value={phone}
            invalid={Boolean(getError("phone"))}
            aria-describedby={
              getError("phone") ? fieldErrorId("craftsman-phone") : undefined
            }
            onChange={(event) => handleChange("phone", event.target.value)}
            onBlur={() => touchField("phone")}
            placeholder="+20 100 000 0000"
            className={`${inputClass} text-left`}
          />
        </Field>
        <Field
          label="رقم الواتساب"
          htmlFor="craftsman-whatsapp"
          hint="(اختياري)"
          error={getError("whatsapp")}
        >
          <TextField
            id="craftsman-whatsapp"
            dir="ltr"
            type="tel"
            inputMode="tel"
            maxLength={FIELD_LIMITS.phoneMax}
            value={whatsapp}
            invalid={Boolean(getError("whatsapp"))}
            aria-describedby={
              getError("whatsapp") ? fieldErrorId("craftsman-whatsapp") : undefined
            }
            onChange={(event) => handleChange("whatsapp", event.target.value)}
            onBlur={() => touchField("whatsapp")}
            placeholder="اختياري — 201000000000"
            className={`${inputClass} text-left`}
          />
        </Field>
      </div>

      <SocialLinksEditor
        links={socialLinks}
        onChange={handleSocialLinksChange}
        error={socialError}
        inputClassName={inputClass}
      />

      <Field
        label="الوصف"
        htmlFor="craftsman-description"
        hint="(اختياري)"
        error={getError("description")}
      >
        <TextArea
          id="craftsman-description"
          value={description}
          maxLength={FIELD_LIMITS.descriptionMax}
          invalid={Boolean(getError("description"))}
          aria-describedby={
            getError("description") ? fieldErrorId("craftsman-description") : undefined
          }
          onChange={(event) => handleChange("description", event.target.value)}
          onBlur={() => touchField("description")}
          placeholder="وصف قصير للخبرة والأعمال"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div>
        <p className="mb-1 text-base font-bold text-foreground">
          صورة الصنايعي <span className="font-normal text-muted">(اختياري)</span>
        </p>
        {shownPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shownPreview}
              alt="معاينة صورة الصنايعي"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              <input
                id="admin-image-input-preview"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={(event) => {
                  setRemoveExisting(false);
                  void selectFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <label
                htmlFor="admin-image-input-preview"
                className="flex min-h-12 cursor-pointer items-center rounded-xl bg-card/90 px-4 text-base font-bold text-foreground shadow-card transition-colors hover:bg-background"
              >
                غيّر الصورة
              </label>
              <button
                type="button"
                onClick={() => {
                  if (preview) {
                    removeImage();
                  } else {
                    setRemoveExisting(true);
                  }
                }}
                className="flex min-h-12 items-center gap-2 rounded-xl bg-card/90 px-4 text-base font-bold text-danger shadow-card transition-colors hover:bg-background"
              >
                <IconX className="h-5 w-5" />
                إزالة
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              id="admin-image-input-empty"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={(event) => {
                void selectFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <label
              htmlFor="admin-image-input-empty"
              className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/40 p-6 text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <IconCamera className="h-8 w-8" />
              <span className="text-base font-bold">اضغط لرفع صورة</span>
              <span className="text-base">
                JPG أو PNG — بنحوّلها لـ WebP أوتوماتيك لحد {MAX_IMAGE_SIZE_MB} ميجا
              </span>
            </label>
          </div>
        )}
        {imageError && (
          <p className="mt-2 text-base font-bold text-accent">{imageError}</p>
        )}
      </div>

      <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-foreground">توثيق</p>
            <p className="text-sm text-muted">شارة «موثّق» على الكارت</p>
          </div>
          <ToggleSwitch
            checked={verified}
            onChange={setVerified}
            label="توثيق الصنايعي"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-foreground">نشر في الدليل</p>
            <p className="text-sm text-muted">يظهر في الموقع العام فوراً</p>
          </div>
          <ToggleSwitch
            checked={isPublished}
            onChange={setIsPublished}
            label="نشر الصنايعي"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {busy ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الصنايعي"}
      </button>
    </form>
  );
}
