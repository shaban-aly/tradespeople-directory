"use client";

import { usePathname } from "next/navigation";

/**
 * PageTransition
 * ──────────────
 * يُعيد تشغيل الـ CSS animation عند كل تغيير في الـ route
 * بالاعتماد على خاصية `key` — عندما تتغير القيمة، React يُعيد
 * بناء العنصر من الصفر وتبدأ الـ animation من نقطة الصفر.
 *
 * - لا يعتمد على manipulate مباشر للـ DOM.
 * - لا يحتاج useEffect / useRef.
 * - يدعم prefers-reduced-motion عبر الـ CSS.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition-wrapper">
      {children}
    </div>
  );
}
