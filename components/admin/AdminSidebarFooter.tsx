import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconLogOut } from "@/components/shared/icons";

/** فوتر السايدبار: صف واحد مضغوط (يوزر + خروج) في الوضع الموسّع. */
export function AdminSidebarFooter({
  email,
  collapsed = false,
  onSignOut,
}: {
  email?: string;
  collapsed?: boolean;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-auto border-t border-border/70 pt-2.5">
      {collapsed ? (
        <AdminButton
          type="button"
          variant="dangerHover"
          size="icon"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
          onClick={onSignOut}
          className="mx-auto h-9 w-9"
        >
          <IconLogOut className="h-4 w-4" />
        </AdminButton>
      ) : (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 px-1">
            <p className="text-xs font-bold leading-tight text-foreground">
              المشرف
            </p>
            {email && (
              <p className="truncate text-xs font-medium text-muted" dir="ltr">
                {email}
              </p>
            )}
          </div>
          <AdminButton
            type="button"
            variant="dangerHover"
            size="icon"
            onClick={onSignOut}
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
            className="shrink-0"
          >
            <IconLogOut className="h-4 w-4" />
          </AdminButton>
        </div>
      )}
    </div>
  );
}
