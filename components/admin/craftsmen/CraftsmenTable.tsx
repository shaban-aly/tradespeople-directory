import Link from "next/link";
import Image from "next/image";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import {
  IconEdit,
  IconExternalLink,
  IconTrash,
  IconUsers,
} from "@/components/shared/icons";
import type { CraftsmanRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";
import { craftsmanHref } from "@/lib/utils/url";

export function CraftsmenTable({
  craftsmen,
  busyKey,
  onToggleVerified,
  onTogglePublished,
  onEdit,
  onDelete,
}: {
  craftsmen: CraftsmanRow[];
  busyKey: string;
  onToggleVerified: (craftsman: CraftsmanRow) => void;
  onTogglePublished: (craftsman: CraftsmanRow) => void;
  onEdit: (craftsman: CraftsmanRow) => void;
  onDelete: (craftsman: CraftsmanRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-right">
        <thead>
          <tr className="border-b border-border text-base text-muted">
            <th className="py-3 pr-2 font-bold">الصنايعي</th>
            <th className="py-3 px-3 font-bold">التخصص</th>
            <th className="py-3 px-3 font-bold">المنطقة</th>
            <th className="py-3 px-3 font-bold">الهاتف</th>
            <th className="py-3 px-3 font-bold">التفاعل</th>
            <th className="py-3 px-3 font-bold">موثّق</th>
            <th className="py-3 px-3 font-bold">منشور</th>
            <th className="py-3 pl-2 font-bold">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {craftsmen.map((craftsman) => (
            <tr
              key={craftsman.id}
              className="border-b border-border last:border-0"
            >
              <td className="py-3 pr-2">
                <div className="flex min-w-0 items-center gap-3">
                  {craftsman.image_url ? (
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
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
                    <p className="truncate text-base font-bold text-foreground">
                      {craftsman.name}
                    </p>
                    <p className="truncate text-sm text-muted" dir="ltr">
                      {craftsman.slug}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 text-base text-muted">
                {craftsman.category?.name}
              </td>
              <td className="py-3 px-3 text-base text-muted">
                {craftsman.area?.name}
              </td>
              <td className="py-3 px-3 text-base text-muted" dir="ltr">
                {craftsman.phone}
              </td>
              <td className="py-3 px-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
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
              </td>
              <td className="py-3 px-3">
                <ToggleSwitch
                  checked={craftsman.verified}
                  onChange={() => onToggleVerified(craftsman)}
                  disabled={busyKey === `craftsman-verified-${craftsman.id}`}
                  label={`توثيق ${craftsman.name}`}
                />
              </td>
              <td className="py-3 px-3">
                <ToggleSwitch
                  checked={craftsman.is_published}
                  onChange={() => onTogglePublished(craftsman)}
                  disabled={busyKey === `craftsman-published-${craftsman.id}`}
                  label={`نشر ${craftsman.name}`}
                />
              </td>
              <td className="py-3 pl-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={craftsmanHref(craftsman.slug)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="عرض في الدليل"
                    className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <IconExternalLink className="h-5 w-5" />
                  </Link>
                  <button
                    type="button"
                    aria-label="تعديل"
                    onClick={() => onEdit(craftsman)}
                    className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <IconEdit className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="حذف"
                    onClick={() => onDelete(craftsman)}
                    className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-danger hover:text-danger"
                  >
                    <IconTrash className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
