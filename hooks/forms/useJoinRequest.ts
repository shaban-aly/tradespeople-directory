"use client";

import { useState } from "react";
import { submitRegisterRequest, submitReportRequest } from "@/lib/db/requests";
import {
  anyError,
  type FieldErrors,
  type RegisterErrors,
  type RegisterFieldName,
  type RegisterFields,
  type ReportErrors,
  type ReportFieldName,
  type ReportFields,
  type SocialLinkDraft,
  validateRegisterField,
  validateRegisterFields,
  validateReportField,
  validateReportFields,
  validateSocialLinks,
} from "@/lib/utils/validation";

export type JoinRequestType = "register" | "report";

export type { RegisterFields, ReportFields };

export function useJoinRequest(initialCategory: string, initialArea: string) {
  const [type, setType] = useState<JoinRequestType>("register");
  const [register, setRegister] = useState<RegisterFields>({
    name: "",
    category: initialCategory,
    area: initialArea,
    phone: "",
    whatsapp: "",
    description: "",
  });
  const [report, setReport] = useState<ReportFields>({
    craftsmanName: "",
    phone: "",
    message: "",
  });
  const [registerTouched, setRegisterTouched] = useState<
    Partial<Record<RegisterFieldName, boolean>>
  >({});
  const [reportTouched, setReportTouched] = useState<
    Partial<Record<ReportFieldName, boolean>>
  >({});
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [reportErrors, setReportErrors] = useState<ReportErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [registerImage, setRegisterImage] = useState<File | null>(null);
  const [registerSocialLinks, setRegisterSocialLinks] = useState<
    SocialLinkDraft[]
  >([]);
  const [registerSocialError, setRegisterSocialError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function setRegisterField(field: RegisterFieldName, value: string) {
    setRegister((prev) => ({ ...prev, [field]: value }));
    if (registerTouched[field]) {
      setRegisterErrors((prev) => ({
        ...prev,
        [field]: validateRegisterField(field, value) ?? undefined,
      }));
    }
  }

  function touchRegisterField(field: RegisterFieldName) {
    setRegisterTouched((prev) => ({ ...prev, [field]: true }));
    setRegisterErrors((prev) => ({
      ...prev,
      [field]: validateRegisterField(field, register[field]) ?? undefined,
    }));
  }

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

  function changeRegisterSocialLinks(links: SocialLinkDraft[]) {
    setRegisterSocialLinks(links);
    setRegisterSocialError("");
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

    if (type === "register") {
      const nextErrors = validateRegisterFields(register);
      setRegisterErrors(nextErrors);
      setRegisterTouched({
        name: true,
        category: true,
        area: true,
        phone: true,
        whatsapp: true,
        description: true,
      });
      if (anyError(nextErrors)) return;

      const activeLinks = registerSocialLinks.filter(
        (link) => link.url.trim() !== "",
      );
      const linksError = validateSocialLinks(activeLinks);
      setRegisterSocialError(linksError ?? "");
      if (linksError) return;
    } else {
      const nextErrors = validateReportFields(report);
      setReportErrors(nextErrors);
      setReportTouched({
        craftsmanName: true,
        phone: true,
        message: true,
      });
      if (anyError(nextErrors)) return;
    }

    setSubmitting(true);
    try {
      if (type === "register") {
        await submitRegisterRequest({
          ...register,
          image: registerImage,
          socialLinks: registerSocialLinks.filter((link) => link.url.trim() !== ""),
        });
      } else {
        await submitReportRequest(report);
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "حصلت مشكلة غير متوقعة",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    type,
    setType,
    register,
    setRegisterField,
    touchRegisterField,
    registerErrors,
    getRegisterError: (field: RegisterFieldName) =>
      getError(registerErrors, registerTouched, field),
    report,
    setReportField,
    touchReportField,
    reportErrors,
    getReportError: (field: ReportFieldName) =>
      getError(reportErrors, reportTouched, field),
    registerImage,
    setRegisterImage,
    registerSocialLinks,
    registerSocialError,
    changeRegisterSocialLinks,
    submitting,
    submitError,
    submitted,
    handleSubmit,
  };
}
