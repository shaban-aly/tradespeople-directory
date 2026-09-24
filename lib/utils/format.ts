export function toArabicDigits(value: number | string): string {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(value).replace(/\d/g, (d) => map[Number(d)]);
}

export function shuffle<T>(arr: readonly T[], seed?: number): T[] {
  const a = [...arr];
  let s = seed ?? Math.floor(Math.random() * 0xffffffff);
  const rand = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatRelativeTimeArabic(
  dateInput: string | number | Date,
  nowMs = Date.now(),
): string {
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const diffMs = nowMs - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "الآن";
  if (diffMin === 1) return "منذ دقيقة";
  if (diffMin === 2) return "منذ دقيقتين";
  if (diffMin >= 3 && diffMin <= 10) return `منذ ${diffMin} دقائق`;
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  if (diffHours === 1) return "منذ ساعة";
  if (diffHours === 2) return "منذ ساعتين";
  if (diffHours >= 3 && diffHours <= 10) return `منذ ${diffHours} ساعات`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return "أمس";
  if (diffDays === 2) return "منذ يومين";
  if (diffDays >= 3 && diffDays <= 10) return `منذ ${diffDays} أيام`;
  return `منذ ${diffDays} يوماً`;
}

