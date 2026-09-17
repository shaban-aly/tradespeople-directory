const DIAMETER = 100;
const RADIUS = 40;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StatsDonut({
  fraction,
  display,
  label,
  sublabel,
  strokeClass = "stroke-chart-1",
  sizeClass = "h-24 w-24 sm:h-28 sm:w-28",
}: {
  /** جزء من 0..1 — يُقصّ تلقائياً داخل المدى */
  fraction: number;
  /** النص أو الرقم في المنتصف أو بجانب الحلقة */
  display: React.ReactNode;
  label: string;
  sublabel?: string;
  strokeClass?: string;
  sizeClass?: string;
}) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  const offset = CIRCUMFERENCE - clamped * CIRCUMFERENCE;

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox={`0 0 ${DIAMETER} ${DIAMETER}`}
        className={`shrink-0 ${sizeClass} -rotate-90`}
        role="img"
        aria-label={`${label}: ${Math.round(clamped * 100)}٪`}
      >
        <circle
          cx={DIAMETER / 2}
          cy={DIAMETER / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-border"
        />
        <circle
          cx={DIAMETER / 2}
          cy={DIAMETER / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={strokeClass}
        />
      </svg>
      <div className="min-w-0">
        <p className="font-heading text-xl font-extrabold text-foreground sm:text-2xl">
          {display}
        </p>
        <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
          {label}
        </p>
        {sublabel && <p className="text-xs leading-snug text-muted sm:text-sm">{sublabel}</p>}
      </div>
    </div>
  );
}