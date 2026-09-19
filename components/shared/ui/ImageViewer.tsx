"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  IconMinus,
  IconPlus,
  IconRefresh,
  IconX,
} from "@/components/shared/icons";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";

export interface ImageViewerProps {
  src: string | null;
  alt?: string;
  title?: string;
  open: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

export function ImageViewer({
  src,
  alt = "صورة",
  title,
  open,
  onClose,
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useBodyScrollLock(open);

  // مراجع لتتبع اللمس والسحب
  const lastTapRef = useRef<number>(0);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  // مزامنة المراجع مع الحالة لتجنب الـ closure stale
  posRef.current = position;
  scaleRef.current = scale;

  // إعادة ضبط الموضع والتكبير عند فتح العارض أو إغلاقه
  useEffect(() => {
    if (open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsTransitioning(false);
    }
  }, [open, src]);

  // إغلاق بـ Escape والتحكم عبر الكيبورد
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleReset();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleZoomIn = useCallback(() => {
    setIsTransitioning(true);
    setScale((prev) => Math.min(prev + 0.5, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setIsTransitioning(true);
    setScale((prev) => {
      const next = Math.max(prev - 0.5, MIN_SCALE);
      if (next === MIN_SCALE) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setIsTransitioning(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // حساب المسافة بين نقطتي لمس للـ Pinch
  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  // بداية اللمس (Pinch أو Drag أو Double-tap)
  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // بدء الـ Pinch
      setIsTransitioning(false);
      pinchStartDistRef.current = getDistance(e.touches[0], e.touches[1]);
      pinchStartScaleRef.current = scaleRef.current;
      dragStartRef.current = null;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();

      // فحص النقر المزدوج (Double-tap)
      if (now - lastTapRef.current < 300) {
        lastTapRef.current = 0;
        setIsTransitioning(true);
        if (scaleRef.current > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(DOUBLE_TAP_SCALE);
          // تركيز التكبير نحو نقطة النقر
          const rect = e.currentTarget.getBoundingClientRect();
          const offsetX = (rect.width / 2 - touch.clientX) * 0.6;
          const offsetY = (rect.height / 2 - touch.clientY) * 0.6;
          setPosition({ x: offsetX, y: offsetY });
        }
        return;
      }
      lastTapRef.current = now;

      // بدء السحب (إذا كانت الصورة مكبرة)
      if (scaleRef.current > 1) {
        setIsTransitioning(false);
        dragStartRef.current = {
          x: touch.clientX - posRef.current.x,
          y: touch.clientY - posRef.current.y,
        };
      }
    }
  };

  // حركة اللمس (تعديل الـ Scale أو الـ Position)
  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      e.preventDefault();
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const factor = currentDist / pinchStartDistRef.current;
      const newScale = Math.min(
        Math.max(pinchStartScaleRef.current * factor, MIN_SCALE),
        MAX_SCALE
      );
      setScale(newScale);
      if (newScale <= 1.05) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && dragStartRef.current && scaleRef.current > 1) {
      const touch = e.touches[0];
      const maxOffset = (scaleRef.current - 1) * 200;
      const nextX = Math.min(
        Math.max(touch.clientX - dragStartRef.current.x, -maxOffset),
        maxOffset
      );
      const nextY = Math.min(
        Math.max(touch.clientY - dragStartRef.current.y, -maxOffset),
        maxOffset
      );
      setPosition({ x: nextX, y: nextY });
    }
  };

  // نهاية اللمس
  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
    dragStartRef.current = null;
    if (scaleRef.current < 1) {
      setIsTransitioning(true);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // دعم التكبير بعجلة الفأرة على أجهزة الكمبيوتر
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, MAX_SCALE));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, MIN_SCALE);
        if (next === MIN_SCALE) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // دعم سحب الماوس على أجهزة الكمبيوتر عند التكبير
  const handleMouseDown = (e: ReactMouseEvent) => {
    if (scale > 1) {
      setIsTransitioning(false);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (dragStartRef.current && scale > 1) {
      const maxOffset = (scale - 1) * 300;
      const nextX = Math.min(
        Math.max(e.clientX - dragStartRef.current.x, -maxOffset),
        maxOffset
      );
      const nextY = Math.min(
        Math.max(e.clientY - dragStartRef.current.y, -maxOffset),
        maxOffset
      );
      setPosition({ x: nextX, y: nextY });
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  if (!open || !src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || alt || "معاينة الصورة"}
      className="fixed inset-0 z-90 flex flex-col bg-black/95 select-none touch-none animate-in fade-in duration-200"
    >
      {/* شريط الأدوات العلوي */}
      <header className="relative z-20 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق العارض"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
          >
            <IconX className="h-5 w-5" />
          </button>
          {title && (
            <h3 className="truncate text-sm sm:text-base font-bold text-white">
              {title}
            </h3>
          )}
        </div>

        {/* أزرار التحكم في التكبير والتصغير */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            title="تصغير (-)"
            aria-label="تصغير"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          >
            <IconMinus className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="إعادة الحجم الافتراضي (0)"
            aria-label="إعادة الحجم الافتراضي"
            className="flex h-9 min-w-14 items-center justify-center rounded-lg bg-white/10 px-2.5 text-xs font-bold text-white transition-colors hover:bg-white/20 active:scale-95"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            title="تكبير (+)"
            aria-label="تكبير"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          >
            <IconPlus className="h-4 w-4" />
          </button>

          {scale > 1 && (
            <button
              type="button"
              onClick={handleReset}
              title="إعادة ضبط"
              aria-label="إعادة ضبط"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent transition-colors hover:bg-accent/30 active:scale-95"
            >
              <IconRefresh className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* منطقة عرض الصورة المركزية */}
      <main
        className="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-6 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          // إغلاق عند النقر على الخلفية فقط إذا لم تكن الصورة مكبرة
          if (e.target === e.currentTarget && scale === 1) {
            onClose();
          }
        }}
      >
        <div
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isTransitioning
              ? "transform 240ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
          }}
          className="relative max-h-full max-w-full origin-center will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="max-h-[82vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl pointer-events-none"
          />
        </div>
      </main>

      {/* تلميح التكبير أسفل الشاشة للموبايل */}
      <footer className="border-t border-white/10 bg-black/40 px-4 py-2.5 text-center text-xs text-white/70 backdrop-blur-md">
        <span>اضغط مرتين للتكبير السريع أو قرّب بإصبعين (Pinch to zoom)</span>
      </footer>
    </div>
  );
}
