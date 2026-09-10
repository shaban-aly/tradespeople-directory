export function SegmentLoading() {
  return (
    <div
      role="status"
      aria-label="جاري التحميل"
      className="mx-auto w-full max-w-5xl px-4 py-8"
    >
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-card border border-border" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-card border border-border" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-card border border-border"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-card border border-border" />
      </div>
    </div>
  );
}