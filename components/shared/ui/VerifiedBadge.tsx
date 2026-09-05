import { IconCheck } from "@/components/shared/icons";

export function VerifiedBadge() {
  return (
    <span
      className="verified-shimmer inline-flex shrink-0 items-center gap-1 rounded-full bg-action px-2.5 py-1 text-xs font-bold text-on-action"
      title="صنايعي موثّق بعد التحقق من بياناته"
      aria-label="صنايعي موثّق"
    >
      <IconCheck className="h-3.5 w-3.5" />
      موثّق
    </span>
  );
}
