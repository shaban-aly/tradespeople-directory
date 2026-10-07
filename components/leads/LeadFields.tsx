

import type { LeadErrors } from "@/lib/utils/validation";

interface LeadFieldsProps {
  categories?: { id: string; name: string }[];
  areas?: { id: string; name: string }[];
  showCategoryArea?: boolean;
  defaultValues?: {
    categoryId?: string;
    areaId?: string;
    description?: string;
    phone?: string;
  };
  phoneHint?: string;
  /** أخطاء التحقق لكل حقل (من نتيجة الـ Server Action) */
  errors?: LeadErrors;
  /** تعطيل الحقول أثناء الإرسال لمنع الإدخال والإرسال المزدوج */
  disabled?: boolean;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-bold text-danger">{message}</p>;
}

export function LeadFields({
  categories = [],
  areas = [],
  showCategoryArea = true,
  defaultValues = {},
  phoneHint,
  errors = {},
  disabled = false,
}: LeadFieldsProps) {
  return (
    <div className="space-y-4">
      {showCategoryArea && (
        <>
          <div>
            <label className="block text-sm font-bold mb-1">ما هو التخصص المطلوب؟</label>
            <select name="category_id" required disabled={disabled} defaultValue={defaultValues.categoryId ?? ""} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60">
              <option value="">اختر التخصص...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <FieldError message={errors.categoryId} />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">في أي منطقة؟</label>
            <select name="area_id" required disabled={disabled} defaultValue={defaultValues.areaId ?? ""} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60">
              <option value="">اختر المنطقة...</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <FieldError message={errors.areaId} />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-bold mb-1">وصف المشكلة</label>
        <textarea 
          name="description" 
          required 
          disabled={disabled}
          defaultValue={defaultValues.description}
          minLength={10}
          maxLength={1000}
          placeholder="مثال: ماسورة الحوض مكسورة وبتنزل مياه..." 
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px] disabled:opacity-60"
        ></textarea>
        <FieldError message={errors.description} />
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">رقم الهاتف للتواصل</label>
        <input 
          type="tel" 
          name="customer_phone" 
          required={showCategoryArea} // Not required on edit
          disabled={disabled}
          defaultValue={defaultValues.phone ?? ""}
          placeholder="01xxxxxxxxx"
          inputMode="tel"
          maxLength={15}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-left disabled:opacity-60" 
          dir="ltr"
        />
        <FieldError message={errors.phone} />
        {phoneHint && <p className="mt-1 text-xs text-muted">{phoneHint}</p>}
      </div>
    </div>
  );
}
