"use client";

import { useState, useTransition } from "react";
import { CheckSquare } from "lucide-react";
import { Button } from "@/components/shared/ui/Button";
import { useToast } from "@/hooks/ui/useToast";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { completeLeadAction } from "@/app/actions/leads";

export function LeadCompleteButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeLeadAction(leadId);
      if (result.success) {
        setConfirming(false);
        toast("success", "تم إنجاز الطلب بنجاح!");
      } else {
        setConfirming(false);
        toast("error", result.error);
      }
    });
  };

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        className="gap-2 font-bold w-full sm:w-auto mt-4"
        onClick={() => setConfirming(true)}
        disabled={isPending}
      >
        <CheckSquare className="w-4 h-4" />
        {isPending ? "جاري التأكيد..." : "تم إنجاز الشغل"}
      </Button>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleComplete}
        title="إنهاء الطلب؟"
        message="هل أنت متأكد أن المشكلة تم حلها والشغل اكتمل؟ سيُغلق الطلب نهائياً ويُشعَر الصنايعية بذلك."
        confirmLabel="نعم، تم إنجاز الشغل"
        busy={isPending}
      />
    </>
  );
}
