"use client";

import { IconMapPin, IconPhone, IconUser } from "@/components/shared/icons";
import type { AreaOption, ProfileFormFieldName } from "@/hooks/dashboard/useCraftsmanProfileForm";

interface ProfileContactSectionProps {
  name: string;
  phone: string;
  whatsapp: string;
  areaId: string;
  areas: AreaOption[];
  getFieldError: (field: ProfileFormFieldName) => string | undefined;
  onFieldChange: (field: ProfileFormFieldName, value: string) => void;
  onFieldBlur: (field: ProfileFormFieldName) => void;
}

export function ProfileContactSection({
  name,
  phone,
  whatsapp,
  areaId,
  areas,
  getFieldError,
  onFieldChange,
  onFieldBlur,
}: ProfileContactSectionProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-action/10 text-action">
            <IconPhone className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-foreground">
            البيانات الأساسية ومعلومات التواصل
          </h2>
        </div>
        <span className="text-xs text-muted">حقول مطلوبة للاتصال</span>
      </div>

      {/* اسم الصنايعي */}
      <div>
        <label
          htmlFor="name-input"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-foreground"
        >
          <IconUser className="h-4 w-4 text-muted" />
          <span>اسمك الكامل أو التجاري *</span>
        </label>
        <input
          id="name-input"
          type="text"
          required
          maxLength={60}
          value={name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          onBlur={() => onFieldBlur("name")}
          placeholder="مثال: أحمد عبد الله"
          className={`min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            getFieldError("name") ? "border-danger focus:border-danger" : "border-border"
          }`}
        />
        {getFieldError("name") ? (
          <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("name")}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            الاسم الذي سيظهر للعملاء في الدليل وعند البحث
          </p>
        )}
      </div>

      {/* أرقام التواصل (موبايل وواتساب) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone-input"
            className="mb-1.5 block text-sm font-bold text-foreground"
          >
            رقم الهاتف الأساسي (للاتصال المباشر) *
          </label>
          <input
            id="phone-input"
            type="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            onBlur={() => onFieldBlur("phone")}
            placeholder="01012345678"
            className={`min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              getFieldError("phone") ? "border-danger focus:border-danger" : "border-border"
            }`}
            dir="ltr"
          />
          {getFieldError("phone") ? (
            <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("phone")}</p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              الرقم الذي سيتصل به العميل مباشرة
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="whatsapp-input"
            className="mb-1.5 block text-sm font-bold text-foreground"
          >
            رقم الواتساب (اختياري)
          </label>
          <input
            id="whatsapp-input"
            type="tel"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => onFieldChange("whatsapp", e.target.value)}
            onBlur={() => onFieldBlur("whatsapp")}
            placeholder="اتركه فارغاً إذا كان نفس رقم الاتصال"
            className={`min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              getFieldError("whatsapp") ? "border-danger focus:border-danger" : "border-border"
            }`}
            dir="ltr"
          />
          {getFieldError("whatsapp") ? (
            <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("whatsapp")}</p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              إذا اختلف عن رقم الاتصال المباشر
            </p>
          )}
        </div>
      </div>

      {/* المنطقة الجغرافية */}
      <div>
        <label
          htmlFor="area-select"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-foreground"
        >
          <IconMapPin className="h-4 w-4 text-muted" />
          <span>حي أو منطقة العمل في السويس</span>
        </label>
        <select
          id="area-select"
          value={areaId}
          onChange={(e) => onFieldChange("areaId", e.target.value)}
          onBlur={() => onFieldBlur("areaId")}
          className={`min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            getFieldError("areaId") ? "border-danger focus:border-danger" : "border-border"
          }`}
        >
          <option value="">اختر المنطقة أو نطاق عملك الرئيسي...</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        {getFieldError("areaId") && (
          <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("areaId")}</p>
        )}
      </div>
    </div>
  );
}
