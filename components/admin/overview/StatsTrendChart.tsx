import type { DailyPoint } from "@/lib/db/analytics";
import { toArabicDigits } from "@/lib/utils/format";

const VIEW_W = 640;
const VIEW_H = 210;
const TOP = 14;
const PAD_BOTTOM = 30;
const PLOT_H = VIEW_H - PAD_BOTTOM;

export function StatsTrendChart({ points }: { points: DailyPoint[] }) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-base leading-snug text-muted">
        لا توجد حركة تفاعل خلال آخر 7 أيام بعد — تظهر هنا المشاهدات وضغطات التواصل يومياً.
      </p>
    );
  }

  const max = Math.max(...points.map((p) => Math.max(p.views, p.contacts, 1)));
  const slot = VIEW_W / points.length;
  const barW = Math.min(22, slot * 0.3);
  const lastIndex = points.length - 1;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-40 w-full sm:h-52"
      role="img"
      aria-label="خط زمني لتفاعل آخر 7 أيام"
    >
      {points.map((p, i) => {
        const xCenter = slot * i + slot / 2;
        const yBase = VIEW_H - PAD_BOTTOM;
        const viewsH = (p.views / max) * (PLOT_H - TOP);
        const contactsH = (p.contacts / max) * (PLOT_H - TOP);
        const dimmed = i !== lastIndex;
        const dayNum = p.day.slice(8, 10);

        return (
          <g key={p.day} className={dimmed ? "opacity-70" : undefined}>
            <rect
              x={xCenter - barW * 1.06}
              y={yBase - viewsH}
              width={barW}
              height={Math.max(viewsH, 2)}
              rx={4}
              className="fill-chart-1"
            />
            <rect
              x={xCenter + barW * 0.06}
              y={yBase - contactsH}
              width={barW}
              height={Math.max(contactsH, 2)}
              rx={4}
              className="fill-chart-2"
            />
            <text
              x={xCenter}
              y={VIEW_H - 8}
              textAnchor="middle"
              className="fill-chart-label text-[11px]"
            >
              {toArabicDigits(Number(dayNum))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StatsTrendLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-chart-1" aria-hidden />
        مشاهدات
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-chart-2" aria-hidden />
        تواصل (اتصال + واتساب)
      </span>
    </div>
  );
}