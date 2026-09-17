import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconRefresh } from "@/components/shared/icons";

export function RefreshButton({ onRefresh }: { onRefresh: () => void }) {
  return (
    <AdminButton
      type="button"
      variant="accentHover"
      className="w-full sm:w-auto"
      onClick={onRefresh}
    >
      <IconRefresh className="h-5 w-5" />
      تحديث
    </AdminButton>
  );
}