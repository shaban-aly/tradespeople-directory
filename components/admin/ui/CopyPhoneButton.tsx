"use client";

import { useState } from "react";
import { AdminButton } from "./AdminButton";
import { IconCheck, IconCopy } from "@/components/shared/icons";
import { useToast } from "@/hooks/ui/useToast";

/** نسخ رقم هاتف بضغطة — للأدمن (كروت الطلبات والدراور). */
export function CopyPhoneButton({
  phone,
  label = "نسخ الرقم",
}: {
  phone: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("error", "لم نتمكن من نسخ الرقم");
    }
  }

  return (
    <AdminButton
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => void copy()}
    >
      {copied ? (
        <IconCheck className="h-5 w-5 text-action" />
      ) : (
        <IconCopy className="h-5 w-5" />
      )}
    </AdminButton>
  );
}
