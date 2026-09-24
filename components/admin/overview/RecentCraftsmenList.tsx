import Link from "next/link";
import Image from "next/image";
import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminButtonLink } from "@/components/admin/ui/AdminButton";
import { IconUsers } from "@/components/shared/icons";
import type { CraftsmanRow } from "@/lib/db/admin";

export function RecentCraftsmenList({ craftsmen }: { craftsmen: CraftsmanRow[] }) {
  return (
    <AdminSection
      title="أحدث الصنايعية"
      description="آخر 5 مضافين في النظام"
      icon={<IconUsers className="h-6 w-6" />}
      action={
        <AdminButtonLink
          href="/admin/craftsmen"
          variant="accentLink"
          className="w-full sm:w-auto"
        >
          عرض الكل
        </AdminButtonLink>
      }
    >
      {craftsmen.length === 0 ? (
        <EmptyState title="لا يوجد صنايعية بعد" />
      ) : (
        <div className="grid gap-2.5">
          {craftsmen.map((craftsman) => (
            <div
              key={craftsman.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-accent/40 sm:p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
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
                <div className="min-w-0">
                  <Link
                    href={`/craftsman/${encodeURIComponent(craftsman.slug)}`}
                    className="block truncate text-sm font-bold text-foreground transition-colors hover:text-accent sm:text-base"
                    title={craftsman.name}
                  >
                    {craftsman.name}
                  </Link>
                  <p className="truncate text-xs text-muted sm:text-sm">
                    {craftsman.category?.name} · {craftsman.area?.name}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  variant={craftsman.verified ? "active" : "inactive"}
                >
                  {craftsman.verified ? "موثّق" : "غير موثق"}
                </StatusBadge>
                <StatusBadge
                  variant={craftsman.is_published ? "active" : "inactive"}
                >
                  {craftsman.is_published ? "منشور" : "مخفي"}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}
