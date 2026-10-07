"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadAction } from "@/app/actions/leads";
import { Button } from "@/components/shared/ui/Button";
import { Modal } from "@/components/shared/ui/Modal";
import { LeadFields } from "./LeadFields";
import { LeadImagePicker, type LeadImageSelection } from "./LeadImagePicker";
import { uploadLeadTempImages } from "@/lib/storage/images";

interface LeadEditModalProps {
  leadId: string;
  initialDescription: string;
  initialImages?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function LeadEditModal({
  leadId,
  initialDescription,
  initialImages = [],
  isOpen,
  onClose,
}: LeadEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<LeadImageSelection | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      // بلا تغيير للصور = undefined (يتخطى السيرفر مسار الصور كلياً).
      let imageUrls: string[] | undefined;
      if (selection) {
        const tempUrls = await uploadLeadTempImages(selection.files);
        imageUrls = [...selection.kept, ...tempUrls];
      }
      const result = await updateLeadAction(
        leadId,
        String(formData.get("description") ?? ""),
        String(formData.get("customer_phone") ?? ""),
        imageUrls,
      );

      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر رفع الصور — حاول مرة أخرى");
    }
    setLoading(false);
  }

  function handleClose() {
    setError("");
    setSelection(null);
    onClose();
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="تعديل الطلب"
      description="يمكنك تعديل وصف المشكلة ورقم الهاتف والصور فقط — التخصص والمنطقة ثابتان."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <LeadFields 
          showCategoryArea={false} 
          defaultValues={{ description: initialDescription }}
          phoneHint="لأسباب خصوصية لا نعرض الرقم المحفوظ — اتركه فارغاً للإبقاء على رقمك الحالي."
          disabled={loading}
        />
        <LeadImagePicker
          initialUrls={initialImages}
          disabled={loading}
          onChange={setSelection}
        />

          {error && <p className="text-sm font-bold text-danger">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
        </Button>
      </form>
    </Modal>
  );
}
