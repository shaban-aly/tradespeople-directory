"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitLead } from "@/app/actions/leads";
import { Button, ButtonLink } from "@/components/shared/ui/Button";
import { CheckCircle } from "lucide-react";
import { LeadFields } from "./LeadFields";
import { LeadImagePicker, type LeadImageSelection } from "./LeadImagePicker";
import { MAX_LEAD_RESPONSES } from "@/lib/db/leads";
import { toArabicDigits } from "@/lib/utils/format";
import { uploadLeadTempImages } from "@/lib/storage/images";
import type { LeadErrors } from "@/lib/utils/validation";

type Category = { id: string; name: string };
type Area = { id: string; name: string };

/** مسودة نصية فقط (الملفات لا تُحفَظ) — مفتاح ثابت واحد لكل المتصفح. */
const DRAFT_KEY = "lead-request-draft";

type LeadDraft = {
  categoryId: string;
  areaId: string;
  description: string;
  phone: string;
};

function readDraft(): LeadDraft {
  if (typeof window === "undefined") {
    return { categoryId: "", areaId: "", description: "", phone: "" };
  }
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<LeadDraft>;
    return {
      categoryId: typeof parsed.categoryId === "string" ? parsed.categoryId : "",
      areaId: typeof parsed.areaId === "string" ? parsed.areaId : "",
      description: typeof parsed.description === "string" ? parsed.description : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
  } catch {
    return { categoryId: "", areaId: "", description: "", phone: "" };
  }
}

/**
 * فورم طلب صنايعي الكامل — المصدر الوحيد للإنشاء (صفحة `/request/new`).
 * يتضمن: الحقول + منتقي الصور + الرفع لحظة الإرسال + مسودة تلقائية
 * للنصوص + حماية single-flight ضد الضغطات المتكررة.
 */
export function LeadRequestForm({
  categories,
  areas,
  quotaText,
}: {
  categories: Category[];
  areas: Area[];
  quotaText?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LeadErrors>({});
  const [selection, setSelection] = useState<LeadImageSelection>({ kept: [], files: [] });
  const [draft] = useState<LeadDraft>(readDraft);
  // Single-flight متزامن: state وحده لا يمنع ضغطتين قبل إعادة الريندر.
  const submittingRef = useRef(false);
  const router = useRouter();

  function persistDraft(form: HTMLFormElement) {
    try {
      const data = new FormData(form);
      const draftValue: LeadDraft = {
        categoryId: String(data.get("category_id") ?? ""),
        areaId: String(data.get("area_id") ?? ""),
        description: String(data.get("description") ?? ""),
        phone: String(data.get("customer_phone") ?? ""),
      };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draftValue));
    } catch {
      // التخزين المحلي غير متاح — تجاهل بصمت.
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    // التقاط الفورم synchronously — بعد أي await يصبح e.currentTarget null.
    const formData = new FormData(e.currentTarget);
    submittingRef.current = true;
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      // الرفع لحظة الإرسال فقط — التراجع قبلها لا يترك ملفات يتيمة.
      const tempUrls = await uploadLeadTempImages(selection.files);
      for (const url of tempUrls) formData.append("image_url", url);
      const result = await submitLead(formData);

      if (!result.success) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      } else {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          // تجاهل بصمت.
        }
        setSuccess(true);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر رفع الصور — حاول مرة أخرى");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="font-bold text-lg">تم إرسال طلبك بنجاح!</h3>
        <p className="text-muted text-sm mt-2">ستتلقى إشعاراً فور موافقة أي فني على طلبك.</p>
        <div className="mt-6 space-y-2">
          <ButtonLink href="/profile/requests" variant="primary" className="w-full">
            تابع طلبك
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={(e) => persistDraft(e.currentTarget)}
      className="space-y-4"
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

      {error && <p className="text-danger text-sm font-bold">{error}</p>}

      {quotaText && <p className="text-xs text-muted">{quotaText}</p>}

      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "جاري الإرسال..." : "إرسال الطلب للصنايعية"}
      </Button>
      <p className="text-xs text-muted text-center">
        أول {toArabicDigits(MAX_LEAD_RESPONSES)} يوافقون تظهر بياناتهم لك للتواصل.
      </p>
    </form>
  );
}
