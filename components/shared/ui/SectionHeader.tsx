export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-sm font-bold text-accent">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        {eyebrow}
      </p>
      <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-2 max-w-2xl text-base text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
