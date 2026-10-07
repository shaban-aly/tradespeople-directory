"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelLeadAction } from "@/app/actions/leads";
import { LeadEditModal } from "@/components/leads/LeadEditModal";
import { IconEdit, IconTrash } from "@/components/shared/icons";
import { Button } from "@/components/shared/ui/Button";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { useToast } from "@/hooks/ui/useToast";

interface LeadActionsProps {
  leadId: string;
  description: string;
  hasResponses?: boolean;
  initialImages?: string[];
}

export function LeadActions({ leadId, description, hasResponses, initialImages = [] }: LeadActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function handleCancel() {
    setBusy(true);
    setError("");
    const result = await cancelLeadAction(leadId);
    if (result.success) {
      setIsConfirming(false);
      toast("success", "تم إلغاء الطلب، وأُشعِر الصنايعية الذين ردّوا.");
      router.refresh();
    } else {
      setError(result.error);
      setIsConfirming(false);
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsEditOpen(true)}
        aria-label="تعديل الطلب"
        disabled={hasResponses || busy}
        title={hasResponses ? "لا يمكن التعديل لوجود عروض" : undefined}
      >
        <IconEdit className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-danger hover:border-danger hover:text-danger"
        onClick={() => setIsConfirming(true)}
        aria-label="إلغاء الطلب"
        disabled={busy}
      >
        <IconTrash className="h-5 w-5" />
      </Button>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}

      <LeadEditModal
        leadId={leadId}
        initialDescription={description}
        initialImages={initialImages}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      <ConfirmDialog
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleCancel}
        title="إلغاء الطلب؟"
        message="سيتم إغلاق طلبك ولن يستقبله أي صنايعي بعد الآن. لا يمكن التراجع عن هذه الخطوة."
        confirmLabel="نعم، إلغاء الطلب"
        danger={true}
        busy={busy}
      />
    </div>
  );
}

