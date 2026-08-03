"use client";

import type { Category } from "@/lib/data/craftsmen";
import {
  useJoinRequest,
  type JoinRequestType,
} from "@/hooks/forms/useJoinRequest";
import { useImageUpload } from "@/hooks/forms/useImageUpload";
import { IconCheck } from "@/components/shared/icons";
import { ImageUpload } from "@/components/join/ImageUpload";
import { SocialLinksEditor } from "@/components/shared/ui/SocialLinksEditor";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import { TextArea } from "@/components/shared/form/TextArea";
import { SelectField } from "@/components/shared/form/SelectField";
import { FIELD_LIMITS } from "@/lib/utils/validation";

export function JoinForm({
  categories,
  areas,
}: {
  categories: Category[];
  areas: string[];
}) {
  const {
    type,
    setType,
    register,
    setRegisterField,
    touchRegisterField,
    getRegisterError,
    report,
    setReportField,
    touchReportField,
    getReportError,
    setRegisterImage,
    submitting,
    submitError,
    submitted,
    registerSocialLinks,
    registerSocialError,
    changeRegisterSocialLinks,
    handleSubmit,
  } = useJoinRequest(categories[0]?.slug ?? "", areas[0] ?? "");
  const imageUpload = useImageUpload();

  async function handleSelectImage(file: File | undefined) {
    const converted = await imageUpload.selectFile(file);
    setRegisterImage(converted);
  }

  function handleRemoveImage() {
    imageUpload.removeImage();
    setRegisterImage(null);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-action/10 text-action">
          <IconCheck className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-xl font-bold">
          {type === "register" ? "تم استلام بياناتك" : "تم استلام بلاغك"}
        </h2>
        <p className="mt-2 text-base text-muted">
          {type === "register"
            ? "هنراجعها ونضيفك قريب. شكراً لانضمامك لدليل الصنايعية!"
            : "هنراجع البيانات ونعدّلها قريب. شكراً لمساعدتك!"}
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-1 font-heading text-3xl font-extrabold sm:text-4xl">
        {type === "register" ? "أضف صنايعي" : "أبلغ عن بيانات خاطئة"}
      </h1>
      <p className="mb-6 text-base text-muted">
        {type === "register"
          ? "املأ البيانات دي وهنراجعها ونضيفك للدليل قريب."
          : "قولنا الصنايعي المقصود ووصف المشكلة وهنراجع البيانات."}
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
      >
        <div>
          <label
            htmlFor="request-type"
            className="mb-1 block text-base font-bold"
          >
            نوع الطلب
          </label>
          <select
            id="request-type"
            value={type}
            onChange={(e) => setType(e.target.value as JoinRequestType)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          >
            <option value="register">تسجيل كصنايعي جديد</option>
            <option value="report">إبلاغ عن بيانات غلط</option>
          </select>
        </div>

        {type === "register" ? (
          <>
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
                    getRegisterError("name")
                      ? fieldErrorId("name")
                      : undefined
                  }
                  onChange={(e) => setRegisterField("name", e.target.value)}
                  onBlur={() => touchRegisterField("name")}
                  placeholder="الاسم بالكامل"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="المنطقة"
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
              <Field
                label="رقم الهاتف"
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
                    getRegisterError("phone")
                      ? fieldErrorId("phone")
                      : undefined
                  }
                  onChange={(e) => setRegisterField("phone", e.target.value)}
                  onBlur={() => touchRegisterField("phone")}
                  placeholder="+20 100 000 0000"
                  className="text-left"
                />
              </Field>
            </div>

            <Field
              label="رقم الواتساب"
              htmlFor="whatsapp"
              hint="(اختياري)"
              error={getRegisterError("whatsapp")}
            >
              <TextField
                id="whatsapp"
                type="tel"
                dir="ltr"
                inputMode="tel"
                maxLength={FIELD_LIMITS.phoneMax}
                value={register.whatsapp}
                invalid={Boolean(getRegisterError("whatsapp"))}
                aria-describedby={
                  getRegisterError("whatsapp")
                    ? fieldErrorId("whatsapp")
                    : undefined
                }
                onChange={(e) => setRegisterField("whatsapp", e.target.value)}
                onBlur={() => touchRegisterField("whatsapp")}
                placeholder="نفس رقم الهاتف لو متركتوش"
                className="text-left"
              />
            </Field>

            <SocialLinksEditor
              links={registerSocialLinks}
              onChange={changeRegisterSocialLinks}
              error={registerSocialError}
            />

            <Field
              label="وصف قصير"
              htmlFor="description"
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
                placeholder="مثال: سباك خبرة 15 سنة، إصلاحات جميع الأعطال"
              />
            </Field>

            <ImageUpload
              preview={imageUpload.preview}
              error={imageUpload.error}
              onSelect={handleSelectImage}
              onRemove={handleRemoveImage}
            />
          </>
        ) : (
          <>
            <Field
              label="اسم الصنايعي المقصود"
              htmlFor="craftsman-name"
              required
              error={getReportError("craftsmanName")}
            >
              <TextField
                id="craftsman-name"
                type="text"
                maxLength={FIELD_LIMITS.nameMax}
                value={report.craftsmanName}
                invalid={Boolean(getReportError("craftsmanName"))}
                aria-describedby={
                  getReportError("craftsmanName")
                    ? fieldErrorId("craftsman-name")
                    : undefined
                }
                onChange={(e) =>
                  setReportField("craftsmanName", e.target.value)
                }
                onBlur={() => touchReportField("craftsmanName")}
                placeholder="مثال: عم محمود عبد الرحمن"
              />
            </Field>
            <Field
              label="رقمك (للتواصل معاك)"
              htmlFor="report-phone"
              required
              error={getReportError("phone")}
            >
              <TextField
                id="report-phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                maxLength={FIELD_LIMITS.phoneMax}
                value={report.phone}
                invalid={Boolean(getReportError("phone"))}
                aria-describedby={
                  getReportError("phone")
                    ? fieldErrorId("report-phone")
                    : undefined
                }
                onChange={(e) => setReportField("phone", e.target.value)}
                onBlur={() => touchReportField("phone")}
                placeholder="+20 100 000 0000"
                className="text-left"
              />
            </Field>
            <Field
              label="وصف المشكلة"
              htmlFor="report-message"
              required
              error={getReportError("message")}
            >
              <TextArea
                id="report-message"
                rows={3}
                maxLength={FIELD_LIMITS.messageMax}
                value={report.message}
                invalid={Boolean(getReportError("message"))}
                aria-describedby={
                  getReportError("message")
                    ? fieldErrorId("report-message")
                    : undefined
                }
                onChange={(e) => setReportField("message", e.target.value)}
                onBlur={() => touchReportField("message")}
                placeholder="مثال: الرقم في الدليل غلط / الصنايعي شغال في تخصص تاني"
              />
            </Field>
          </>
        )}

        {submitError && (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-base font-bold text-accent">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 rounded-xl bg-accent px-4 text-lg font-bold text-on-accent transition-colors hover:bg-accent/90"
        >
          {submitting
            ? "جاري الإرسال..."
            : type === "register"
              ? "أرسل بياناتك"
              : "أرسل البلاغ"}
        </button>
      </form>
    </>
  );
}
