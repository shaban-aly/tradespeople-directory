"use client";

import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { Modal } from "@/components/admin/Modal";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import type { JoinRequestRow } from "@/lib/db/admin";
import { IMAGE_ASPECT, withImageAspect } from "@/lib/utils/image-transform";
import { useState } from "react";

export function ApproveRequestModal({
  request,
  open,
  busy,
  onConfirm,
  onClose,
}: {
  request: JoinRequestRow | null;
  open: boolean;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  return (
    <>
      <ImageViewer
        open={Boolean(viewerSrc)}
        src={viewerSrc}
        alt={request?.name ?? "صورة الطلب"}
        onClose={() => setViewerSrc(null)}
      />
      <Modal
        open={open}
        onClose={onClose}
        title="موافقة على طلب التسجيل"
        footer={
          <>
            <AdminButton
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
            >
              إلغاء
            </AdminButton>
            <AdminButton
              type="button"
              variant="action"
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? "جاري النشر..." : "نشر الصنايعي"}
            </AdminButton>
          </>
        }
      >
        {request && (
          <div className="grid gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-base font-bold text-foreground">
                معاينة الصنايعي قبل النشر
              </p>
              <div className="grid gap-2 text-base text-muted">
                <p>
                  <span className="font-bold text-foreground">الاسم: </span>
                  {request.name}
                </p>
                <p>
                  <span className="font-bold text-foreground">التخصص: </span>
                  {request.category?.name}
                </p>
                <p>
                  <span className="font-bold text-foreground">المنطقة: </span>
                  {request.area?.name}
                </p>
                <p dir="ltr" className="text-right">
                  <span className="font-bold text-foreground">الهاتف: </span>
                  {request.phone}
                </p>
                <p dir="ltr" className="text-right">
                  <span className="font-bold text-foreground">الرابط: </span>
                  /craftsman/
                  {request.category?.slug}-{request.id.slice(0, 8)}
                </p>
                {request.socialLinks?.length ? (
                  <div className="rounded-xl bg-background/40 p-3">
                    <p className="mb-1 text-sm font-bold text-foreground">
                      روابط السوشيال
                    </p>
                    {request.socialLinks.map((link) => (
                      <p
                        key={link.platform}
                        dir="ltr"
                        className="truncate text-left"
                      >
                        {link.platform}: {link.url}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
              {request.image_url && (
                <button
                  type="button"
                  onClick={() => setViewerSrc(request.image_url)}
                  aria-label={`تكبير صورة ${request.name ?? "الطلب"}`}
                  className="relative mt-3 aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-xl"
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
            </div>
            <p className="text-base text-muted">
              بعد الموافقة سيتاح الصنايعي في الدليل فوراً بنشر تلقائي.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
