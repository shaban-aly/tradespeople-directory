type StatusVariant =
  | "pending"
  | "approved"
  | "rejected"
  | "reviewed"
  | "dismissed"
  | "active"
  | "inactive"
  | "open"
  | "claimed"
  | "completed"
  | "expired"
  | "cancelled";

const variantClass: Record<StatusVariant, string> = {
  pending: "bg-accent/10 text-accent",
  approved: "bg-action/15 text-action",
  rejected: "bg-danger/10 text-danger",
  reviewed: "bg-action/15 text-action",
  dismissed: "bg-muted/15 text-muted",
  active: "bg-action/15 text-action",
  inactive: "bg-muted/10 text-muted",
  open: "bg-accent/10 text-accent",
  claimed: "bg-warning/15 text-warning",
  completed: "bg-action/15 text-action",
  expired: "bg-muted/15 text-muted",
  cancelled: "bg-danger/10 text-danger",
};

export function StatusBadge({
  variant,
  children,
}: {
  variant: StatusVariant;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-base font-bold ${variantClass[variant]}`}
    >
      {children}
    </span>
  );
}
