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
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  claimed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  expired: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
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
