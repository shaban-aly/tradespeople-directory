import Image from "next/image";
import {
  IconPhone,
  IconPin,
  IconUsers,
} from "@/components/shared/icons";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ActionMenu, type ActionMenuProps } from "@/components/admin/craftsmen/ActionMenu";
import { toArabicDigits } from "@/lib/utils/format";

export function CraftsmanMobileCard({
  craftsman,
  busyKey,
  onToggleVerified,
  onTogglePublished,
  onEdit,
  onDelete,
  onView,
  onLinkAccount,
}: ActionMenuProps) {
  return (
    <div className="relative grid gap-3 rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-card w-full max-w-full overflow-hidden">
      {/* قسم الهيدر مع توفير مساحة كافية لأيقونة الإجراءات الثابتة */}
      <div className="flex items-start gap-2.5 pe-11">
        {craftsman.image_url ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border">
            <Image
              src={craftsman.image_url}
              alt={craftsman.name}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconUsers className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="truncate text-sm sm:text-base font-bold text-foreground">
              {craftsman.name}
            </p>
            {craftsman.verified && (
              <span className="shrink-0">
                <VerifiedBadge />
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted block max-w-full" dir="ltr">
            {craftsman.slug}
          </p>
        </div>
      </div>

      {/* أيقونة الإجراءات مثبتة دائماً في الزاوية العلوية ولن تخرج مهما طال الاسم أو السلاج */}
      <div className="absolute top-3.5 end-3.5 z-10">
        <ActionMenu
          craftsman={craftsman}
          busyKey={busyKey}
          onToggleVerified={onToggleVerified}
          onTogglePublished={onTogglePublished}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onLinkAccount={onLinkAccount}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {craftsman.category && (
          <span className="rounded-lg bg-accent/10 px-2.5 py-1 font-bold text-accent">
            {craftsman.category.name}
          </span>
        )}
        {craftsman.area && (
          <span className="flex items-center gap-1 rounded-lg bg-muted/15 px-2 py-1 font-medium text-foreground">
            <IconPin className="h-3 w-3 text-muted" />
            {craftsman.area.name}
          </span>
        )}
        <span
          className={`ms-auto rounded-lg px-2.5 py-1 text-xs font-bold ${
            craftsman.is_published
              ? "bg-action/10 text-action"
              : "bg-muted/20 text-muted"
          }`}
        >
          {craftsman.is_published ? "منشور" : "مخفي"}
        </span>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/50 p-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted min-w-0">
          <IconPhone className="h-3.5 w-3.5 text-accent shrink-0" />
          <span dir="ltr" className="font-semibold text-foreground truncate">
            {craftsman.phone}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <span title="ضغطات الاتصال">
            اتصال {toArabicDigits(craftsman.stats?.calls ?? 0)}
          </span>
          <span className="text-border">·</span>
          <span title="ضغطات الواتساب">
            واتساب {toArabicDigits(craftsman.stats?.whatsapp ?? 0)}
          </span>
          <span className="text-border">·</span>
          <span title="مشاهدات الصفحة">
            مشاهدة {toArabicDigits(craftsman.stats?.views ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
