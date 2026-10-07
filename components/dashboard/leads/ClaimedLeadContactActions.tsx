"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withdrawLeadResponseAction } from "@/app/actions/leads";
import { Button, ButtonAnchor } from "@/components/shared/ui/Button";
import { IconCheck, IconCopy, IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { useToast } from "@/hooks/ui/useToast";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { telHref } from "@/lib/utils/time";
import { whatsappHref } from "@/lib/utils/url";

export function ClaimedLeadContactActions({ phone, leadId }: { phone: string; leadId: string }) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("error", "لم نتمكن من نسخ الرقم");
    }
  }

  async function handleWithdraw() {
    setBusy(true);
    const result = await withdrawLeadResponseAction(leadId);
    setBusy(false);
    setConfirming(false);
    if (result.success) {
      toast("success", "تم سحب استلامك للطلب");
      router.refresh();
    } else {
      toast("error", result.error);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:min-w-64">
      {/* صف الاتصال: رقم الهاتف (زر اتصال) + نسخ */}
      <div className="flex items-stretch gap-2">
        <ButtonAnchor
          href={telHref(phone)}
          aria-label={`الاتصال بالعميل ${phone}`}
          variant="outline"
          size="md"
          className="min-h-12 flex-1 justify-center font-mono text-base font-bold"
        >
          <IconPhone className="h-4 w-4" />
          <span dir="ltr">{phone}</span>
        </ButtonAnchor>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="نسخ رقم العميل"
          onClick={() => void copyPhone()}
        >
          {copied ? (
            <IconCheck className="h-5 w-5 text-action" />
          ) : (
            <IconCopy className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* صف الإجراءات: واتساب + سحب الاستلام */}
      <div className="flex gap-2">
        <ButtonAnchor
          href={whatsappHref(phone)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="مراسلة العميل على واتساب"
          variant="action"
          size="md"
          className="min-h-12 flex-1 justify-center gap-2"
        >
          <IconWhatsApp className="h-5 w-5" />
          واتساب العميل
        </ButtonAnchor>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="min-h-12 flex-1 justify-center text-danger hover:bg-danger hover:text-on-danger"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          سحب الاستلام
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void handleWithdraw()}
        title="سحب الاستلام؟"
        message="سيتم تحرير مقعدك لصنايعي آخر، ويبقى بإمكانك استلام الطلب مرة أخرى طالما لم يمتلئ. هل أنت متأكد؟"
        confirmLabel="نعم، سحب الاستلام"
        danger={true}
        busy={busy}
      />
    </div>
  );
}