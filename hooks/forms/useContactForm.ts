"use client";

import { useState } from "react";
import { submitContactMessage } from "@/lib/db/contact";
import {
  anyError,
  type FieldErrors,
  validateMessage,
  validateName,
  validatePhone,
} from "@/lib/utils/validation";

type ContactFields = {
  name: string;
  phone: string;
  message: string;
};

type ContactFieldName = keyof ContactFields;

const validators: Record<ContactFieldName, (value: string) => string | null> = {
  name: validateName,
  phone: validatePhone,
  message: validateMessage,
};

export function useContactForm() {
  const [form, setForm] = useState<ContactFields>({
    name: "",
    phone: "",
    message: "",
  });
  const [touched, setTouched] = useState<Partial<Record<ContactFieldName, boolean>>>({});
  const [errors, setErrors] = useState<FieldErrors<ContactFieldName>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleChange(field: ContactFieldName, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validators[field](value) ?? undefined,
      }));
    }
  }

  function handleBlur(field: ContactFieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validators[field](form[field]) ?? undefined,
    }));
  }

  function getError(field: ContactFieldName): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const nextErrors: FieldErrors<ContactFieldName> = {
      name: validateName(form.name) ?? undefined,
      phone: validatePhone(form.phone) ?? undefined,
      message: validateMessage(form.message) ?? undefined,
    };
    setErrors(nextErrors);
    setTouched({ name: true, phone: true, message: true });
    if (anyError(nextErrors)) return;
    setSubmitting(true);
    try {
      await submitContactMessage(form);
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
    form,
    handleChange,
    handleBlur,
    getError,
    handleSubmit,
    submitting,
    submitError,
    submitted,
  };
}
