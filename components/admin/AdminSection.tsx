export function AdminSection({
  title,
  description,
  action,
  icon,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:gap-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon && <span className="shrink-0 text-muted">{icon}</span>}
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-foreground sm:text-2xl">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm leading-snug text-muted sm:text-base">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="w-full sm:w-auto sm:shrink-0">{action}</div>
        )}
      </div>
      {children}
    </section>
  );
}
