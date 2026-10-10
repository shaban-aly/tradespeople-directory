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
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-lg font-extrabold text-foreground sm:text-3xl truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-base line-clamp-1 sm:line-clamp-none">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">{actions}</div>
      )}
    </div>
  );
}
