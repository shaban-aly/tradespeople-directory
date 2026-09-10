"use client";

import { useReportRequest } from "@/hooks/forms/useReportRequest";
import { IconCheck } from "@/components/shared/icons";
import { Button } from "@/components/shared/ui/Button";
import { Field, fieldErrorId } from "@/components/shared/form/Field";
import { TextField } from "@/components/shared/form/TextField";
import { TextArea } from "@/components/shared/form/TextArea";
import { FIELD_LIMITS } from "@/lib/utils/validation";

export function ReportForm({ initialCraftsmanName = "" }: { initialCraftsmanName?: string }) {
  const {
    report,
    setReportField,
    touchReportField,
    getReportError,
    submitting,
    submitError,
    submitted,
    handleSubmit,
  } = useReportRequest(initialCraftsmanName);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-action/10 text-action">
          <IconCheck className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-xl font-bold">تم استلام بلاغك</h2>
        <p className="mt-2 text-base text-muted">
          هنراجع البيانات ونعدّلها قريب. شكراً لمساعدتك!
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-1 font-heading text-3xl font-extrabold sm:text-4xl">
        أبلغ عن بيانات خاطئة
      </h1>
      <p className="mb-6 text-base text-muted">
        قولنا الصنايعي المقصود ووصف المشكلة وهنراجع البيانات ونعدّلها قريب.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
      >
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

        {submitError && (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-base font-bold text-accent">
            {submitError}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? "جاري الإرسال..." : "أرسل البلاغ"}
        </Button>
      </form>
    </>
  );
}