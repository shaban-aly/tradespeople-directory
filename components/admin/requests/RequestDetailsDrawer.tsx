"use client";

import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { Drawer } from "@/components/admin/Drawer";
import { DetailField } from "@/components/admin/ui/DetailField";
import { IconUsers } from "@/components/shared/icons";
import type { JoinRequestRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";
import { IMAGE_ASPECT, withImageAspect } from "@/lib/utils/image-transform";
import { useState } from "react";

export function RequestDetailsDrawer({
  request,
  open,
  onClose,
}: {
  request: JoinRequestRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  return (
    <Drawer open={open} onClose={onClose} title="تفاصيل طلب التسجيل">
      <ImageViewer
        open={Boolean(viewerSrc)}
        src={viewerSrc}
        alt={request?.name ?? "صورة الطلب"}
        onClose={() => setViewerSrc(null)}
      />
      {request && (
        <div className="grid gap-3 text-base text-muted">
          <DetailField label="الحالة">
            {request.status === "pending"
              ? "معلق"
              : request.status === "approved"
                ? "مقبول"
                : "مرفوض"}
          </DetailField>
          <DetailField label="التاريخ">
            {toArabicDigits(request.created_at)}
          </DetailField>
          <DetailField label="الاسم">{request.name}</DetailField>
          <DetailField label="التخصص">{request.category?.name}</DetailField>
          <DetailField label="المنطقة">{request.area?.name}</DetailField>
          <DetailField label="الهاتف" dir="ltr" className="text-right">
            {request.phone}
          </DetailField>
          {request.whatsapp && (
            <DetailField label="واتساب" dir="ltr" className="text-right">
              {request.whatsapp}
            </DetailField>
          )}
          {request.description && (
            <DetailField label="الوصف">{request.description}</DetailField>
          )}
          {request.socialLinks?.length ? (
            <div className="rounded-xl bg-background/40 p-3">
              <p className="mb-1 text-sm font-bold text-foreground">
                روابط السوشيال
              </p>
              {request.socialLinks.map((link) => (
                <p key={link.platform} dir="ltr" className="truncate text-left">
                  {link.platform}: {link.url}
                </p>
              ))}
            </div>
          ) : null}
          {request.image_url && (
            <button
              type="button"
              onClick={() => setViewerSrc(request.image_url)}
              aria-label={`تكبير صورة ${request.name ?? "الطلب"}`}
              className="relative aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-xl"
            >
              <Image
                src={withImageAspect(request.image_url, IMAGE_ASPECT.CARD)}
                alt={request.name ?? "صورة الطلب"}
                fill
                sizes="(min-width: 640px) 640px, 342px"
                className="object-cover"
              />
            </button>
          )}
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-accent/10 p-4 text-accent">
            <IconUsers className="h-6 w-6 shrink-0" />
            <p className="text-base">
              افحص البيانات جيداً قبل اتخاذ قرار الموافقة أو الرفض.
            </p>
          </div>
        </div>
      )}
    </Drawer>
  );
}
