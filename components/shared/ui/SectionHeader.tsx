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
      <p className="mb-2 text-base font-bold text-accent">{eyebrow}</p>
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
