"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimLeadAction } from "@/app/actions/leads";
import { Button } from "@/components/shared/ui/Button";
import { IconCheck } from "@/components/shared/icons";
import { useToast } from "@/hooks/ui/useToast";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";

interface LeadsClaimButtonProps {
  leadId: string;
  craftsmanId: string;
}

export function LeadsClaimButton({ leadId, craftsmanId }: LeadsClaimButtonProps) {
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleConfirm() {
    setError("");
    startTransition(async () => {
      const result = await claimLeadAction(leadId, craftsmanId);
      if (result.success) {
        setConfirming(false);
        toast("success", "تم تسجيل استلامك، تواصل مع العميل الآن.");
        router.refresh();
        // رقم العميل في قسم "المستلمة" أسفل القائمة — ننزل إليه مباشرة.
        window.setTimeout(() => {
          document
            .getElementById("claimed-leads")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 600);
      } else {
        setConfirming(false);
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="primary"
        className="w-full min-h-11 font-bold gap-2"
        disabled={isPending}
        onClick={() => setConfirming(true)}
      >
        <IconCheck className="h-4 w-4" />
        <span>{isPending ? "جاري التسجيل..." : "أنا متاح — استلام الطلب والتواصل"}</span>
      </Button>
      {error && <p className="text-danger text-sm font-bold">{error}</p>}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        title="استلام الطلب؟"
        message="سيظهر رقم هاتف العميل لك فوراً وأنت مسؤول عن التواصل معه. لا يمكن التراجع إلا بسحب الاستلام."
        confirmLabel="نعم، أريد الاستلام"
        busy={isPending}
      />
    </div>
  );
}
