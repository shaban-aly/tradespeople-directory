export function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 shadow-card sm:gap-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm leading-snug text-muted">{label}</p>
          <p className="mt-1 font-heading text-xl font-extrabold text-foreground sm:mt-1.5 sm:text-2xl">
            {value}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-accent/10 p-2 text-accent sm:p-2.5">
          {icon}
        </div>
      </div>
      {hint && <p className="text-xs leading-snug text-muted">{hint}</p>}
    </div>
  );
}
