"use client";

import { useState } from "react";
import { submitReportRequest } from "@/lib/db/requests";
import {
  anyError,
  type FieldErrors,
  type ReportErrors,
  type ReportFieldName,
  type ReportFields,
  validateReportField,
  validateReportFields,
} from "@/lib/utils/validation";

export type { ReportFields };

export function useReportRequest(initialCraftsmanName = "") {
  const [report, setReport] = useState<ReportFields>({
    craftsmanName: initialCraftsmanName,
    phone: "",
    message: "",
  });
  const [reportTouched, setReportTouched] = useState<
    Partial<Record<ReportFieldName, boolean>>
  >({});
  const [reportErrors, setReportErrors] = useState<ReportErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function setReportField(field: ReportFieldName, value: string) {
    setReport((prev) => ({ ...prev, [field]: value }));
    if (reportTouched[field]) {
      setReportErrors((prev) => ({
        ...prev,
        [field]: validateReportField(field, value) ?? undefined,
      }));
    }
  }

  function touchReportField(field: ReportFieldName) {
    setReportTouched((prev) => ({ ...prev, [field]: true }));
    setReportErrors((prev) => ({
      ...prev,
      [field]: validateReportField(field, report[field]) ?? undefined,
    }));
  }

  function getError<T extends string>(
    errors: FieldErrors<T>,
    touched: Partial<Record<T, boolean>>,
    field: T,
  ): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const nextErrors = validateReportFields(report);
    setReportErrors(nextErrors);
    setReportTouched({
      craftsmanName: true,
      phone: true,
      message: true,
    });
    if (anyError(nextErrors)) return;

    setSubmitting(true);
    try {
      await submitReportRequest(report);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "حصلت مشكلة غير متوقعة",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setReport({
      craftsmanName: initialCraftsmanName,
      phone: "",
      message: "",
    });
    setReportTouched({});
    setReportErrors({});
    setSubmitError("");
    setSubmitted(false);
  }

  return {
    report,
    setReportField,
    touchReportField,
    reportErrors,
    getReportError: (field: ReportFieldName) =>
      getError(reportErrors, reportTouched, field),
    submitting,
    submitError,
    submitted,
    handleSubmit,
    resetForm,
  };
}