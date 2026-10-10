"use client";

import { Button, ButtonLink } from "@/components/shared/ui/Button";
import { IconRefresh } from "@/components/shared/icons";
import { AlertCircle, CheckCircle } from "lucide-react";
import { LeadFields } from "./LeadFields";
import { LeadImagePicker } from "./LeadImagePicker";
import { MAX_LEAD_RESPONSES } from "@/lib/db/leads";
import { toArabicDigits } from "@/lib/utils/format";
import { useLeadRequestForm } from "@/hooks/leads/useLeadRequestForm";

type Category = { id: string; name: string; slug?: string; icon?: string };
type Area = { id: string; name: string };

/**
 * فورم طلب صنايعي الكامل — مكوّن عرض خالص يركز على الـ UI.
 * المنطق وحفظ المسودات وحالة الإرسال مفصولة في `useLeadRequestForm`.
 */
export function LeadRequestForm({
  categories,
  areas,
  quotaText,
  initialValues,
}: {
  categories: Category[];
  areas: Area[];
  quotaText?: string;
  initialValues?: {
    categoryId?: string;
    areaId?: string;
  };
}) {
  const {
    loading,
    success,
    error,
    fieldErrors,
    selection,
    setSelection,
    draft,
    persistDraft,
    handleSubmit,
  } = useLeadRequestForm({ initialValues });

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="font-bold text-lg">تم إرسال طلبك بنجاح!</h3>
        <p className="text-muted text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          نبهنا الفنيين المتخصصين في منطقتك، وستصلك إشعارات فور موافقة الفنيين المتاحين للتواصل المباشر معك.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center max-w-xs mx-auto">
          <ButtonLink href="/my-requests" variant="primary" className="w-full">
            تابع طلبك الآن
          </ButtonLink>
          <ButtonLink href="/" variant="outline" className="w-full">
            الرئيسية
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={(e) => persistDraft(e.currentTarget)}
      className="space-y-5"
    >
      <LeadFields
        categories={categories}
        areas={areas}
        errors={fieldErrors}
        disabled={loading}
        defaultValues={{
          categoryId: draft.categoryId,
          areaId: draft.areaId,
          description: draft.description,
          phone: draft.phone,
        }}
      />
      <LeadImagePicker disabled={loading} onChange={setSelection} />

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {quotaText && (
        <div className="flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3.5 py-2.5 text-xs font-bold text-accent">
          <span className="flex h-2 w-2 shrink-0 rounded-full bg-accent" />
          <span>{quotaText}</span>
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full text-base font-bold min-h-12" disabled={loading}>
        {loading ? (
          <>
            <IconRefresh className="h-5 w-5 animate-spin" />
            <span>
              {selection.files.length > 0
                ? "جاري رفع الصور وإرسال الطلب..."
                : "جاري إرسال الطلب..."}
            </span>
          </>
        ) : (
          "إرسال الطلب للفنيين المعتمدين"
        )}
      </Button>
      <p className="text-xs text-muted text-center leading-relaxed">
        خدمة مجانية تماماً — أول {toArabicDigits(MAX_LEAD_RESPONSES)} فنيين يوافقون على طلبك ستظهر بياناتهم لك للتواصل والتسعير.
      </p>
    </form>
  );
}
