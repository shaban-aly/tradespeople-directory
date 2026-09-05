// توليد ألوان ثابتة (deterministic) من الاسم لكل صنايعي،
// بحيث يظهر نفس اللون دائماً لنفس الاسم (صلاحية للـ hydration).
//
// اللون مأخوذ من ألوان التصنيفات المثبتة في globals.css (cat-1..8) حتى
// تبقى كل الألوان من CSS variables ومن نفس نظام ألوان البراند.

const AVATAR_INDEX = 8;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function craftColor(seed: string): string {
  const index = (hashString(seed) % AVATAR_INDEX) + 1;
  return `var(--cat-${index})`;
}

// أول حرفين من الاسم (إلى اليمين غالباً) بعد إزالة الفراغات
export function craftInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return (first + last).trim() || first;
}
