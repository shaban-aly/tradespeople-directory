type StatusVariant = "pending" | "approved" | "rejected" | "active" | "inactive";

const variantClass: Record<StatusVariant, string> = {
  pending: "bg-accent/10 text-accent",
  approved: "bg-action/15 text-action",
  rejected: "bg-danger/10 text-danger",
  active: "bg-action/15 text-action",
  inactive: "bg-muted/10 text-muted",
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
