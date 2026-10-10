"use client";

import type { LeadErrors } from "@/lib/utils/validation";
import { LeadCategorySelector, type LeadCategoryItem } from "./LeadCategorySelector";
import { LeadAreaSelector, type LeadAreaItem } from "./LeadAreaSelector";
import { IconPhone } from "@/components/shared/icons";
import { AlertCircle } from "lucide-react";
import { useLeadFields, type LeadFieldsDefaultValues } from "@/hooks/leads/useLeadFields";

interface LeadFieldsProps {
  categories?: LeadCategoryItem[];
  areas?: LeadAreaItem[];
  showCategoryArea?: boolean;
  defaultValues?: LeadFieldsDefaultValues;
  phoneHint?: string;
  /** أخطاء التحقق لكل حقل (من نتيجة الـ Server Action) */
  errors?: LeadErrors;
  /** تعطيل الحقول أثناء الإرسال لمنع الإدخال والإرسال المزدوج */
  disabled?: boolean;
  onDraftChange?: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-danger animate-in fade-in duration-200">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/**
 * مكوّن حقول طلب الصنايعي — مكوّن عرض خالص يركز على الـ UI.
 * المنطق، وتزامن المسودة، وحساب طول النص مفصول في `useLeadFields`.
 */
export function LeadFields({
  categories = [],
  areas = [],
  showCategoryArea = true,
  defaultValues = {},
  phoneHint,
  errors = {},
  disabled = false,
  onDraftChange,
}: LeadFieldsProps) {
  const {
    categoryId,
    areaId,
    description,
    phone,
    descLength,
    containerRef,
    handleCategoryChange,
    handleAreaChange,
    handleDescriptionChange,
    handlePhoneChange,
  } = useLeadFields({ defaultValues, onDraftChange });

  return (
    <div ref={containerRef} className="space-y-5">
      {showCategoryArea && (
        <>
          <LeadCategorySelector
            categories={categories}
            selectedId={categoryId}
            onSelect={handleCategoryChange}
            disabled={disabled}
            error={errors.categoryId}
          />

          <LeadAreaSelector
            areas={areas}
            selectedId={areaId}
            onSelect={handleAreaChange}
            disabled={disabled}
            error={errors.areaId}
          />
        </>
      )}

      <div>
        <label className="block text-sm font-bold mb-1.5 text-foreground">
          وصف المشكلة <span className="text-danger">*</span>
        </label>
        <textarea
          name="description"
          required
          disabled={disabled}
          value={description}
          minLength={10}
          maxLength={1000}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="مثال: ماسورة الحوض مكسورة وبتنزل مياه في المطبخ، محتاج سباك يجي يغيرها..."
          className={`w-full min-h-[110px] rounded-xl border px-3.5 py-3 text-base text-foreground placeholder:text-muted disabled:opacity-60 leading-relaxed transition-colors ${
            errors.description
              ? "border-danger bg-danger/5 focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
              : "border-border bg-background hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          }`}
        />
        <FieldError message={errors.description} />
        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <p>اكتب تفاصيل كافية ليتمكن الفني من تقدير حجم العمل وتجهيز العدة.</p>
          <span
            className={`shrink-0 font-mono ${
              descLength > 0 && descLength < 10
                ? "font-bold text-danger"
                : "text-muted"
            }`}
          >
            {descLength > 0 && descLength < 10
              ? `باقي ${10 - descLength} أحرف`
              : `${descLength}/1000`}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1.5 text-foreground">
          رقم الهاتف للتواصل <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            name="customer_phone"
            required={showCategoryArea}
            disabled={disabled}
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="01xxxxxxxxx"
            inputMode="tel"
            maxLength={15}
            className={`w-full rounded-xl border py-3 pl-11 pr-3.5 text-base text-foreground placeholder:text-muted disabled:opacity-60 text-left font-mono transition-colors ${
              errors.phone
                ? "border-danger bg-danger/5 focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
                : "border-border bg-background hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            }`}
            dir="ltr"
          />
          <IconPhone
            className={`pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 transition-colors ${
              errors.phone ? "text-danger" : "text-muted"
            }`}
          />
        </div>
        <FieldError message={errors.phone} />
        <p className="mt-1 text-xs text-muted">
          {phoneHint || "رقمك في أمان تام؛ لن يُنشر للعامة وسيُتاح فقط لأول ٣ فنيين يوافقون على طلبك مباشرةً."}
        </p>
      </div>
    </div>
  );
}
