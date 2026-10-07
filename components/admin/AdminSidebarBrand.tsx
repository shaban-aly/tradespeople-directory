import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@/components/shared/icons";

/** رأس السايدبار: هوية اللوحة + زر طي/توسيع (سطح المكتب فقط). */
export function AdminSidebarBrand({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2.5">
      <Link
        href="/admin"
        className={`flex items-center gap-2.5 rounded-xl transition-colors hover:opacity-90 ${
          collapsed ? "mx-auto" : "px-1"
        }`}
        title="دليل الصنايعية - لوحة التحكم"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-heading font-extrabold text-base shadow-sm">
          د
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="block font-heading text-base font-extrabold text-foreground truncate leading-tight">
              دليل الصنايعية
            </span>
            <span className="text-[11px] font-semibold text-muted">
              لوحة التحكم
            </span>
          </div>
        )}
      </Link>

      {/* Collapse toggle button on desktop */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "توسيع السايد بار" : "طي السايد بار"}
          title={collapsed ? "توسيع" : "طي"}
          className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:border-accent hover:text-accent transition-colors"
        >
          {collapsed ? (
            <IconChevronLeft className="h-4 w-4" />
          ) : (
            <IconChevronRight className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
