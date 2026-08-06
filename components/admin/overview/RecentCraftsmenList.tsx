import Link from "next/link";
import Image from "next/image";
import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { IconUsers } from "@/components/shared/icons";
import type { CraftsmanRow } from "@/lib/db/admin";

export function RecentCraftsmenList({ craftsmen }: { craftsmen: CraftsmanRow[] }) {
  return (
    <AdminSection
      title="أحدث الصنايعية"
      description="آخر 5 مضافين"
      icon={<IconUsers className="h-6 w-6" />}
      action={
        <Link
          href="/admin/craftsmen"
          className="min-h-12 rounded-xl border border-border px-4 py-2.5 text-base font-bold text-accent transition-colors hover:bg-accent/10"
        >
          الكل
        </Link>
      }
    >
      {craftsmen.length === 0 ? (
        <EmptyState title="لا يوجد صنايعية بعد" />
      ) : (
        <div className="grid gap-3">
          {craftsmen.map((craftsman) => (
            <div
              key={craftsman.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 sm:p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                {craftsman.image_url ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={craftsman.image_url}
                      alt={craftsman.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <IconUsers className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-foreground">
                    {craftsman.name}
                  </p>
                  <p className="truncate text-base text-muted">
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
