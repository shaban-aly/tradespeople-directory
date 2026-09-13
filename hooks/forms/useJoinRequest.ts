"use client";

import { useState } from "react";
import { submitCraftsmanApplication } from "@/lib/db/requests";
import {
  anyError,
  type FieldErrors,
  type RegisterErrors,
  type RegisterFieldName,
  type RegisterFields,
  type SocialLinkDraft,
  validateRegisterField,
  validateRegisterFields,
  validateSocialLinks,
} from "@/lib/utils/validation";

export type { RegisterFields };

export function useJoinRequest(
  initialCategory: string,
  initialArea: string,
) {
  const [register, setRegister] = useState<RegisterFields>({
    name: "",
    category: initialCategory,
    area: initialArea,
    phone: "",
    whatsapp: "",
    description: "",
  });
  const [registerTouched, setRegisterTouched] = useState<
    Partial<Record<RegisterFieldName, boolean>>
  >({});
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [registerImage, setRegisterImage] = useState<File | null>(null);
  const [registerSocialLinks, setRegisterSocialLinks] = useState<
    SocialLinkDraft[]
  >([]);
  const [registerSocialError, setRegisterSocialError] = useState("");
  const [registerImageError, setRegisterImageError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function changeRegisterImage(file: File | null) {
    setRegisterImage(file);
    if (file) setRegisterImageError("");
  }

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

    if (!registerImage) {
      setRegisterImageError("صورة الصنايعي مطلوبة");
      return;
    }
    setRegisterImageError("");

    setSubmitting(true);
    try {
      await submitCraftsmanApplication({
        ...register,
        image: registerImage,
        socialLinks: activeLinks,
      });
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
    register,
    setRegisterField,
    touchRegisterField,
    registerErrors,
    getRegisterError: (field: RegisterFieldName) =>
      getError(registerErrors, registerTouched, field),
    registerImage,
    changeRegisterImage,
    registerImageError,
    registerSocialLinks,
    registerSocialError,
    changeRegisterSocialLinks,
    submitting,
    submitError,
    submitted,
    handleSubmit,
  };
}