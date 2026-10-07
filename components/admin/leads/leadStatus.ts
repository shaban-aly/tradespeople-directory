import type { StatusBadge } from "@/components/admin/StatusBadge";
import type { ComponentProps } from "react";

type StatusVariant = ComponentProps<typeof StatusBadge>["variant"];

/** خريطة حالات الطلب الموحدة لكارت الأدمن والدراور — مصدر واحد للعربي والألوان. */
export const LEAD_STATUS_MAP: Record<
  string,
  { label: string; variant: StatusVariant }
> = {
  open: { label: "مفتوح", variant: "open" },
  claimed: { label: "مستلم", variant: "claimed" },
  completed: { label: "مكتمل", variant: "completed" },
  expired: { label: "منتهي", variant: "expired" },
  cancelled: { label: "ملغي", variant: "cancelled" },
};

export function leadStatusInfo(status: string): {
  label: string;
  variant: StatusVariant;
} {
  return LEAD_STATUS_MAP[status] ?? { label: status, variant: "pending" };
}
