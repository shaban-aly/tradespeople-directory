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
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{label}</p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-foreground">
            {value}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-accent/10 p-2.5 text-accent">
          {icon}
        </div>
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
