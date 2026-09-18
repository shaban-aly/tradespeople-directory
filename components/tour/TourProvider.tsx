"use client";

import dynamic from "next/dynamic";
import { useTour } from "@/hooks/tour/useTour";

const TourOverlay = dynamic(() => import("@/components/tour/TourOverlay").then((m) => m.TourOverlay), {
  ssr: false,
  loading: () => null,
});

/** موفّر الجولة التعريفية: يربط منطق الجولة بطبقة العرض فوق كل الصفحة. */
export function TourProvider() {
  const tour = useTour();

  return (
    <TourOverlay
      tour={tour.tour}
      step={tour.step}
      stepIndex={tour.stepIndex}
      total={tour.total}
      status={tour.status}
      isMobile={tour.isMobile}
      target={tour.target}
      keepOut={tour.keepOut}
      isFirst={tour.isFirst}
      isLast={tour.isLast}
      onNext={tour.next}
      onPrev={tour.prev}
      onClose={tour.close}
    />
  );
}