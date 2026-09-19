"use client";

import type { Category } from "@/lib/data/craftsmen";
import { useJoinRequest } from "@/hooks/forms/useJoinRequest";
import { useImageUpload } from "@/hooks/forms/useImageUpload";
import { IconCheck } from "@/components/shared/icons";
import { Button, ButtonLink } from "@/components/shared/ui/Button";
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

  if (submitted) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-action/10 text-action ring-8 ring-action/5">
          <IconCheck className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          تم استلام طلب إضافة الصنايعي بنجاح!
        </h2>
        <p className="mt-2.5 max-w-md mx-auto text-base text-muted leading-relaxed">
          شكراً لمساهمتك في دعم وتطوير دليل صنايعية السويس. طلبك الآن قيد المراجعة والتدقيق.
        </p>

        {/* خريطة الخطوات القادمة */}
        <div className="my-6 rounded-2xl border border-border bg-background/60 p-4 text-start sm:p-5">
          <h3 className="mb-3 font-heading text-sm font-bold text-foreground">
            ماذا سيحدث بعد ذلك؟
          </h3>
          <ol className="space-y-2.5 text-sm text-muted">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-xs text-accent">
                1
              </span>
              <span>
                <strong className="text-foreground">مراجعة المشرف:</strong> التحقق من صحة أرقام الهاتف والتخصص والمنطقة لضمان جودة الدليل.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-xs text-accent">
                2
              </span>
              <span>
                <strong className="text-foreground">النشر والتوثيق:</strong> بمجرد الاعتماد، يظهر ملف الصنايعي في نتائج البحث وقوائم التخصص فوراً.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-xs text-accent">
                3
              </span>
              <span>
                <strong className="text-foreground">إدارة الملف:</strong> حسابك أصبح مرتبطاً بهذا الصنايعي، وستتمكن من تعديل بياناته وصوره في أي وقت.
              </span>
            </li>
          </ol>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <ButtonLink href="/categories" variant="primary" className="w-full sm:w-auto">
            تصفح دليل الفنيين
          </ButtonLink>
          <ButtonLink href="/" variant="ghost" className="w-full sm:w-auto">
            الصفحة الرئيسية
          </ButtonLink>
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            className="w-full sm:w-auto"
          >
            إضافة صنايعي آخر
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-1 font-heading text-3xl font-extrabold sm:text-4xl">
        أضف صنايعي
      </h1>
      <p className="mb-6 text-base text-muted">
        املى البيانات دي وهيتم ربط الصنايعي بحسابك — لما المشرف يوافق،
        هتلاقي بياناته تحت إدارتك.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
      >
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
            placeholder="مثال: سباك خبرة 15 سنة، إصلاحات جميع الأعطال"
          />
        </Field>

        <ImageUpload
          preview={imageUpload.preview}
          error={imageUpload.error || registerImageError}
          required
          onSelect={handleSelectImage}
          onRemove={handleRemoveImage}
        />

        {submitError && (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-base font-bold text-accent">
            {submitError}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? "جاري الإرسال..." : "أرسل بياناتك"}
        </Button>
      </form>
    </>
  );
}