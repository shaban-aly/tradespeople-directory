import { IconCheck } from "@/components/shared/icons";

export function VerifiedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-action/10 px-2.5 py-1 text-xs font-bold text-action">
      <IconCheck className="h-3.5 w-3.5" />
      موثّق
    </span>
  );
}
