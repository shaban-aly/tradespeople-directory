import { IconRefresh } from "@/components/shared/icons";

export function RefreshButton({ onRefresh }: { onRefresh: () => void }) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 text-base font-bold text-foreground transition-colors hover:border-accent hover:text-accent sm:w-auto"
    >
      <IconRefresh className="h-5 w-5" />
      تحديث
    </button>
  );
}
