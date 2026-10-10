"use client";

import type { Category } from "@/lib/data/craftsmen";
import { useJoinRequest } from "@/hooks/forms/useJoinRequest";
import { useImageUpload } from "@/hooks/forms/useImageUpload";
import { Button } from "@/components/shared/ui/Button";
import { ImageUpload } from "@/components/join/ImageUpload";
import { SocialLinksEditor } from "@/components/shared/ui/SocialLinksEditor";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import { TextArea } from "@/components/shared/form/TextArea";
import { SelectField } from "@/components/shared/form/SelectField";
import { FIELD_LIMITS } from "@/lib/utils/validation";
import { JoinHeader } from "@/components/join/JoinHeader";
import { JoinBenefits } from "@/components/join/JoinBenefits";
import { JoinLivePreview } from "@/components/join/JoinLivePreview";
import { JoinSuccessState } from "@/components/join/JoinSuccessState";
import { IconCheck, IconShieldCheck } from "@/components/shared/icons";

export function JoinForm({
  categories,
  areas,
}: {
  categories: Category[];
  areas: string[];
}) {
  const imageUpload = useImageUpload();
  const {
    register,
    setRegisterField,
    touchRegisterField,
    getRegisterError,
    changeRegisterImage,
    registerImageError,
    submitting,
    submitError,
    submitted,
    registerSocialLinks,
    registerSocialError,
    changeRegisterSocialLinks,
    sameAsPhone,
    toggleSameAsPhone,
    handleSubmit,
    resetForm,
  } = useJoinRequest(categories[0]?.slug ?? "", areas[0] ?? "");

  async function handleSelectImage(file: File | undefined) {
    const converted = await imageUpload.selectFile(file);
    changeRegisterImage(converted);
  }

  function handleRemoveImage() {
    imageUpload.removeImage();
    changeRegisterImage(null);
  }

  const selectedCategory =
    categories.find((c) => c.slug === register.category) ?? categories[0];

  if (submitted) {
    return (
      <JoinSuccessState
        craftsmanName={register.name}
        categoryName={selectedCategory?.name}
        area={register.area}
        onReset={resetForm}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
      {/* العمود الرئيسي: الترويسة والنموذج */}
      <div className="space-y-6 lg:col-span-7">
        <JoinHeader />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7"
        >
          {/* المجموعة 1: البيانات الشخصية والمهنة */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-2xs font-bold text-on-accent shadow-2xs">
                1
              </span>
              <span>البيانات الأساسية والتخصص</span>
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="الاسم"
                htmlFor="name"
                required
                error={getRegisterError("name")}
              >
                <TextField
                  id="name"
                  type="text"
                  maxLength={FIELD_LIMITS.nameMax}
                  value={register.name}
                  invalid={Boolean(getRegisterError("name"))}
                  aria-describedby={
                    getRegisterError("name") ? fieldErrorId("name") : undefined
                  }
                  onChange={(e) => setRegisterField("name", e.target.value)}
                  onBlur={() => touchRegisterField("name")}
                  placeholder="الاسم بالكامل (أو الشهرة)"
                />
              </Field>

              <Field
                label="التخصص"
                htmlFor="category"
                required
                error={getRegisterError("category")}
              >
                <SelectField
                  id="category"
                  value={register.category}
                  invalid={Boolean(getRegisterError("category"))}
                  aria-describedby={
                    getRegisterError("category")
                      ? fieldErrorId("category")
                      : undefined
                  }
                  onChange={(e) => setRegisterField("category", e.target.value)}
                  onBlur={() => touchRegisterField("category")}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
              </Field>
            </div>

            <Field
              label="المنطقة أو الحي"
              htmlFor="area"
              required
              error={getRegisterError("area")}
            >
              <SelectField
                id="area"
                value={register.area}
                invalid={Boolean(getRegisterError("area"))}
                aria-describedby={
                  getRegisterError("area") ? fieldErrorId("area") : undefined
                }
                onChange={(e) => setRegisterField("area", e.target.value)}
                onBlur={() => touchRegisterField("area")}
              >
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </SelectField>
            </Field>
          </fieldset>

          <div className="h-px w-full bg-border/60" />

          {/* المجموعة 2: أرقام التواصل والتواجد */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-2xs font-bold text-on-accent shadow-2xs">
                2
              </span>
              <span>أرقام التواصل والصفحات</span>
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="رقم الهاتف الأساسي"
                htmlFor="phone"
                required
                error={getRegisterError("phone")}
              >
                <TextField
                  id="phone"
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={FIELD_LIMITS.phoneMax}
                  value={register.phone}
                  invalid={Boolean(getRegisterError("phone"))}
                  aria-describedby={
                    getRegisterError("phone") ? fieldErrorId("phone") : undefined
                  }
                  onChange={(e) => setRegisterField("phone", e.target.value)}
                  onBlur={() => touchRegisterField("phone")}
                  placeholder="+20 100 000 0000"
                  className="text-left"
                />
              </Field>

              <div className="space-y-2">
                <Field
                  label="رقم الواتساب"
                  htmlFor="whatsapp"
                  hint={sameAsPhone ? "(نفس رقم الهاتف)" : "(اختياري)"}
                  error={getRegisterError("whatsapp")}
                >
                  <TextField
                    id="whatsapp"
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    maxLength={FIELD_LIMITS.phoneMax}
                    value={register.whatsapp}
                    disabled={sameAsPhone}
                    invalid={Boolean(getRegisterError("whatsapp"))}
                    aria-describedby={
                      getRegisterError("whatsapp")
                        ? fieldErrorId("whatsapp")
                        : undefined
                    }
                    onChange={(e) => setRegisterField("whatsapp", e.target.value)}
                    onBlur={() => touchRegisterField("whatsapp")}
                    placeholder="نفس رقم الهاتف لو متركتوش"
                    className="text-left disabled:bg-muted/10 disabled:opacity-75"
                  />
                </Field>

                <label
                  className={`flex items-center gap-2.5 cursor-pointer select-none text-xs rounded-xl border p-2.5 transition-all ${sameAsPhone
                      ? "border-action/40 bg-action/10 text-foreground font-bold shadow-2xs"
                      : "border-border/70 bg-background/50 text-muted hover:border-border hover:text-foreground"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => toggleSameAsPhone(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-action focus:ring-action accent-action"
                  />
                  <span>رقم الواتساب هو نفس رقم الهاتف الأساسي</span>
                </label>
              </div>
            </div>

            <SocialLinksEditor
              links={registerSocialLinks}
              onChange={changeRegisterSocialLinks}
              error={registerSocialError}
            />
          </fieldset>

          <div className="h-px w-full bg-border/60" />

          {/* المجموعة 3: صورة الكارت والنبذة التعريفية */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-2xs font-bold text-on-accent shadow-2xs">
                3
              </span>
              <span>الصورة ونبذة عن خبرتك</span>
            </legend>

            <ImageUpload
              preview={imageUpload.preview}
              error={imageUpload.error || registerImageError}
              required
              onSelect={handleSelectImage}
              onRemove={handleRemoveImage}
            />

            <Field
              label="نبذة عن خبرتك وخدماتك"
              htmlFor="description"
              hint={`(${register.description.length}/${FIELD_LIMITS.descriptionMax})`}
              error={getRegisterError("description")}
            >
              <TextArea
                id="description"
                rows={3}
                maxLength={FIELD_LIMITS.descriptionMax}
                value={register.description}
                invalid={Boolean(getRegisterError("description"))}
                aria-describedby={
                  getRegisterError("description")
                    ? fieldErrorId("description")
                    : undefined
                }
                onChange={(e) =>
                  setRegisterField("description", e.target.value)
                }
                onBlur={() => touchRegisterField("description")}
                placeholder="مثال: خبرة أكثر من 12 سنة في تأسيس وتشطيب وصيانة السباكة لجميع مناطقء السويس..."
              />
            </Field>
          </fieldset>

          {/* تنبيه الخطأ العام */}
          {submitError && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-base font-bold text-danger">
              {submitError}
            </p>
          )}

          {/* زر الإرسال وتطمين الخصوصية */}
          <div className="space-y-2.5 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full min-h-12 text-base font-bold shadow-sm"
            >
              {submitting ? "جاري إرسال طلبك..." : "انضم لدليل الصنايعية الآن"}
            </Button>

            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-background/60 py-2 px-3 text-2xs text-muted shadow-2xs">
              <IconShieldCheck className="h-4 w-4 text-accent shrink-0" />
              <span>مراجعة واعتماد مباشر من الإدارة للحفاظ على ثقة العملاء</span>
            </div>
          </div>
        </form>
      </div>

      {/* العمود الجانبي: المعاينة الحية ومزايا الانضمام */}
      <aside className="space-y-6 lg:col-span-5 lg:sticky lg:top-24">
        <JoinLivePreview
          name={register.name}
          category={selectedCategory}
          area={register.area}
          phone={register.phone}
          whatsapp={register.whatsapp}
          description={register.description}
          imagePreview={imageUpload.preview}
        />

        <JoinBenefits />
      </aside>
    </div>
  );
}