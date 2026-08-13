export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-base text-muted">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
