export const FIELD_LIMITS = {
  nameMin: 2,
  nameMax: 60,
  slugMin: 3,
  slugMax: 60,
  descriptionMin: 10,
  descriptionMax: 1000,
  messageMin: 5,
  messageMax: 1500,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 72,
  phoneMin: 10,
  phoneMax: 15,
} as const;

const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u0085]/g;

const DANGEROUS_PATTERNS = [
  /<\s*\/?[a-z!]/i,
  /<\s*(script|style|iframe|object|embed|form|link|meta)\b/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon(error|load|click|dblclick|mouseover|mouseout|mousedown|mouseup|focus|blur|change|input|submit|drag)\s*=\s*["']?/i,
];

const NAME_PATTERN = /^[\p{L}\p{N}\p{M}\s.,،()'\-]+$/u;

const EGYPT_MOBILE = /^(?:\+?20|0020|0)?1[0-9]{9}$/;

const INTERNATIONAL_PHONE = /^\+\d{8,14}$/;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export function cleanText(value: string): string {
  return value.replace(CONTROL_CHARS, "").trim();
}

export function hasDangerousContent(value: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
}

export function normalizePhone(value: string): string {
  return value.replace(CONTROL_CHARS, "").replace(/[\s().\-_]/g, "");
}

export function anyError(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function firstError(errors: FieldErrors): string | null {
  const message = Object.values(errors).find(Boolean);
  return message ?? null;
}

export function validateName(value: string, required = true): string | null {
  const clean = cleanText(value);
  if (!clean) return required ? "الاسم مطلوب" : null;
  if (hasDangerousContent(clean)) return "الاسم فيه محتوى غير مسموح";
  if (!NAME_PATTERN.test(clean)) return "الاسم فيه رموز غير مسموحة";
  if (/^\d+$/.test(clean)) return "الاسم لا يمكن أن يكون أرقاماً فقط";
  if (clean.length < FIELD_LIMITS.nameMin) {
    return `الاسم لازم ${FIELD_LIMITS.nameMin} أحرف على الأقل`;
  }
  if (clean.length > FIELD_LIMITS.nameMax) {
    return `الاسم أقصى حد ${FIELD_LIMITS.nameMax} حرف`;
  }
  return null;
}

export function validatePhone(value: string, required = true): string | null {
  const clean = cleanText(value);
  if (!clean) return required ? "رقم الهاتف مطلوب" : null;
  if (hasDangerousContent(clean)) return "رقم الهاتف فيه رموز غير مسموحة";
  const digits = normalizePhone(clean);
  if (!/^\+?\d+$/.test(digits)) return "رقم الهاتف لازم أرقام فقط";
  if (digits.replace(/\D/g, "").length < FIELD_LIMITS.phoneMin) {
    return "رقم الهاتف قصير جداً";
  }
  if (digits.length > FIELD_LIMITS.phoneMax) {
    return "رقم الهاتف طويل جداً";
  }
  if (EGYPT_MOBILE.test(digits) || INTERNATIONAL_PHONE.test(digits)) return null;
  return "رقم الهاتف غير صحيح — لازم رقم موبايل صحيح بالكود الدولي";
}

export function validateSlug(value: string, required = true): string | null {
  const clean = cleanText(value).toLowerCase();
  if (!clean) return required ? "الرابط (slug) مطلوب" : null;
  if (clean.length < FIELD_LIMITS.slugMin || clean.length > FIELD_LIMITS.slugMax) {
    return `الرابط لازم من ${FIELD_LIMITS.slugMin} لـ ${FIELD_LIMITS.slugMax} حرف`;
  }
  if (!SLUG_PATTERN.test(clean)) {
    return "الرابط لازم أحرف إنجليزية وأرقام وشرطات بين الكلمات بس";
  }
  return null;
}

export function validateDescription(value: string, required = false): string | null {
  const clean = cleanText(value);
  if (!clean) return required ? "الوصف مطلوب" : null;
  if (hasDangerousContent(clean)) return "الوصف فيه محتوى غير مسموح";
  if (clean.length < FIELD_LIMITS.descriptionMin) {
    return `الوصف لازم ${FIELD_LIMITS.descriptionMin} أحرف على الأقل`;
  }
  if (clean.length > FIELD_LIMITS.descriptionMax) {
    return `الوصف أقصى حد ${FIELD_LIMITS.descriptionMax} حرف`;
  }
  return null;
}

export function validateMessage(value: string, required = true): string | null {
  const clean = cleanText(value);
  if (!clean) return required ? "الرسالة مطلوبة" : null;
  if (hasDangerousContent(clean)) return "الرسالة فيها محتوى غير مسموح";
  if (clean.length < FIELD_LIMITS.messageMin) {
    return `الرسالة لازم ${FIELD_LIMITS.messageMin} أحرف على الأقل`;
  }
  if (clean.length > FIELD_LIMITS.messageMax) {
    return `الرسالة أقصى حد ${FIELD_LIMITS.messageMax} حرف`;
  }
  return null;
}

export function validateEmail(value: string, required = true): string | null {
  const clean = cleanText(value).toLowerCase();
  if (!clean) return required ? "البريد الإلكتروني مطلوب" : null;
  if (clean.length > FIELD_LIMITS.emailMax) {
    return "البريد الإلكتروني أطول من اللازم";
  }
  if (!EMAIL_PATTERN.test(clean)) return "البريد الإلكتروني غير صحيح";
  return null;
}

export function validatePassword(value: string, required = true): string | null {
  if (!value) return required ? "كلمة المرور مطلوبة" : null;
  if (value.length < FIELD_LIMITS.passwordMin) {
    return `كلمة المرور لازم ${FIELD_LIMITS.passwordMin} أحرف على الأقل`;
  }
  if (value.length > FIELD_LIMITS.passwordMax) {
    return `كلمة المرور أقصى حد ${FIELD_LIMITS.passwordMax} حرف`;
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "كلمة المرور لازم تحتوي على حرف إنجليزي ورقم";
  }
  return null;
}

export function validateRequiredChoice(
  value: string,
  message: string,
  required = true,
): string | null {
  if (!cleanText(value)) return required ? message : null;
  return null;
}

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "tiktok",
  "other",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialLinkDraft = {
  platform: SocialPlatform;
  url: string;
};

export const SOCIAL_LINKS_LIMITS = {
  max: 4,
  urlMax: 500,
} as const;

export function validateSocialLinkUrl(value: string): string | null {
  const clean = cleanText(value);
  if (!clean) return "الرابط مطلوب";
  if (hasDangerousContent(clean)) return "الرابط فيه محتوى غير مسموح";
  if (clean.length > SOCIAL_LINKS_LIMITS.urlMax) {
    return "الرابط أطول من اللازم";
  }
  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "الرابط لازم يبدأ بـ http أو https";
    }
    if (!parsed.hostname.includes(".")) return "الرابط غير صحيح";
    return null;
  } catch {
    return "الرابط غير صحيح — اكتب الرابط كامل (https://...)";
  }
}

export function validateSocialLinks(
  links: { platform: string; url: string }[],
): string | null {
  if (links.length > SOCIAL_LINKS_LIMITS.max) {
    return `أقصى عدد روابط ${SOCIAL_LINKS_LIMITS.max}`;
  }
  const seen = new Set<string>();
  for (const link of links) {
    if (!(SOCIAL_PLATFORMS as readonly string[]).includes(link.platform)) {
      return "منصة غير معروفة";
    }
    if (seen.has(link.platform)) {
      return "لا يمكن تكرار نفس المنصة";
    }
    seen.add(link.platform);
    const error = validateSocialLinkUrl(link.url);
    if (error) return error;
  }
  return null;
}

export type RegisterFields = {
  name: string;
  category: string;
  area: string;
  phone: string;
  whatsapp: string;
  description: string;
};

export type RegisterFieldName = keyof RegisterFields;

export type RegisterErrors = FieldErrors<RegisterFieldName>;

export function validateRegisterField(
  field: RegisterFieldName,
  value: string,
): string | null {
  switch (field) {
    case "name":
      return validateName(value);
    case "category":
      return validateRequiredChoice(value, "اختر التخصص");
    case "area":
      return validateRequiredChoice(value, "اختر المنطقة");
    case "phone":
      return validatePhone(value);
    case "whatsapp":
      return validatePhone(value, false);
    case "description":
      return validateDescription(value);
  }
}

export function validateRegisterFields(fields: RegisterFields): RegisterErrors {
  return {
    name: validateName(fields.name) ?? undefined,
    category: validateRequiredChoice(fields.category, "اختر التخصص") ?? undefined,
    area: validateRequiredChoice(fields.area, "اختر المنطقة") ?? undefined,
    phone: validatePhone(fields.phone) ?? undefined,
    whatsapp: validatePhone(fields.whatsapp, false) ?? undefined,
    description: validateDescription(fields.description) ?? undefined,
  };
}

export type ReportFields = {
  craftsmanName: string;
  phone: string;
  message: string;
};

export type ReportFieldName = keyof ReportFields;

export type ReportErrors = FieldErrors<ReportFieldName>;

export function validateReportField(
  field: ReportFieldName,
  value: string,
): string | null {
  switch (field) {
    case "craftsmanName":
      return validateName(value);
    case "phone":
      return validatePhone(value);
    case "message":
      return validateMessage(value);
  }
}

export function validateReportFields(fields: ReportFields): ReportErrors {
  return {
    craftsmanName: validateName(fields.craftsmanName) ?? undefined,
    phone: validatePhone(fields.phone) ?? undefined,
    message: validateMessage(fields.message) ?? undefined,
  };
}

export type CraftsmanErrors = FieldErrors<
  | "name"
  | "slug"
  | "categoryId"
  | "areaId"
  | "phone"
  | "whatsapp"
  | "description"
>;

export function validateCraftsmanFields(fields: {
  name: string;
  slug: string;
  categoryId: string;
  areaId: string;
  phone: string;
  whatsapp: string;
  description: string;
}): CraftsmanErrors {
  return {
    name: validateName(fields.name) ?? undefined,
    slug: validateSlug(fields.slug) ?? undefined,
    categoryId: validateRequiredChoice(fields.categoryId, "اختر التخصص") ?? undefined,
    areaId: validateRequiredChoice(fields.areaId, "اختر المنطقة") ?? undefined,
    phone: validatePhone(fields.phone) ?? undefined,
    whatsapp: validatePhone(fields.whatsapp, false) ?? undefined,
    description: validateDescription(fields.description) ?? undefined,
  };
}

export type CategoryFormFields = {
  name: string;
  slug: string;
};

export type CategoryFormErrors = FieldErrors<"name" | "slug">;

export function validateCategoryFields(fields: CategoryFormFields): CategoryFormErrors {
  return {
    name: validateName(fields.name) ?? undefined,
    slug: validateSlug(fields.slug) ?? undefined,
  };
}
