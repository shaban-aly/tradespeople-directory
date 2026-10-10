import Link from "next/link";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
import { IconTrendingUp, IconPhone, IconWhatsApp, IconUsers } from "@/components/shared/icons";
import type { MostContactedItem } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";
import { IMAGE_ASPECT, withImageAspect } from "@/lib/utils/image-transform";

export function MostContactedList({
  items,
}: {
  items: MostContactedItem[];
}) {
  return (
    <AdminSection
      title="الأكثر تواصلاً"
      description="أعلى صنايعية من حيث تفاعلات الاتصال والواتساب"
      icon={<IconTrendingUp className="h-6 w-6" />}
    >
      {items.length === 0 ? (
        <EmptyState title="لا توجد تفاعلات مسجلة بعد" />
      ) : (
        <div className="grid gap-2.5">
          {items.map((item, index) => {
            const calls = item.craftsman.stats?.calls ?? 0;
            const whatsapp = item.craftsman.stats?.whatsapp ?? 0;
            const total = calls + whatsapp;

            return (
              <div
                key={item.craftsman.id}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-accent/40 sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-heading text-sm font-black ${
                      index === 0
                        ? "border border-warning/40 bg-warning/15 text-warning"
                        : index === 1
                        ? "border border-border bg-muted/20 text-foreground"
                        : index === 2
                        ? "border border-warning/25 bg-warning/10 text-warning/90"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {toArabicDigits(index + 1)}
                  </span>

                  {item.craftsman.image_url ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border">
                      <Image
                        src={withImageAspect(item.craftsman.image_url, IMAGE_ASPECT.SQUARE)}
                        alt={item.craftsman.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <IconUsers className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <Link
                      href={`/craftsman/${encodeURIComponent(item.craftsman.slug)}`}
                      className="block truncate text-sm font-bold text-foreground transition-colors hover:text-accent sm:text-base"
                      title={item.craftsman.name}
                    >
                      {item.craftsman.name}
                    </Link>
                    <p className="truncate text-xs text-muted sm:text-sm">
                      {item.craftsman.category?.name} · {item.craftsman.area?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 rounded-lg bg-action/15 px-2 py-1 font-semibold text-action">
                    <IconWhatsApp className="h-3.5 w-3.5" />
                    {toArabicDigits(whatsapp)}
                  </span>
                  <span className="flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1 font-semibold text-accent">
                    <IconPhone className="h-3.5 w-3.5" />
                    {toArabicDigits(calls)}
                  </span>
                  <span className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold text-muted">
                    إجمالي {toArabicDigits(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminSection>
  );
}
