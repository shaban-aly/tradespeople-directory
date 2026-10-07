"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/shared/ui/Button";
import { useToast } from "@/hooks/ui/useToast";
import { renewLeadAction } from "@/app/actions/leads";

export function LeadRenewButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRenew = () => {
    startTransition(async () => {
      const result = await renewLeadAction(leadId);
      if (result.success) {
        toast("success", "تم تجديد طلبك لمدة 24 ساعة جديدة وأُعِيد إشعار الصنايعية.");
      } else {
        toast("error", result.error);
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 font-bold w-full sm:w-auto"
      onClick={handleRenew}
      disabled={isPending}
    >
      <RefreshCw className={`w-4 h-4${isPending ? " animate-spin" : ""}`} />
      {isPending ? "جاري التجديد..." : "تجديد الطلب 24 ساعة"}
    </Button>
  );
}
