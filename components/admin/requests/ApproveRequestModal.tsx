import Image from "next/image";
import { Modal } from "@/components/admin/Modal";
import type { JoinRequestRow } from "@/lib/db/admin";

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
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="موافقة على طلب التسجيل"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-12 rounded-xl bg-action px-4 text-base font-bold text-on-action disabled:opacity-50"
          >
            {busy ? "جاري النشر..." : "نشر الصنايعي"}
          </button>
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
                    <p key={link.platform} dir="ltr" className="truncate text-left">
                      {link.platform}: {link.url}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
            {request.image_url && (
              <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl">
                <Image
                  src={request.image_url}
                  alt={request.name ?? "صورة الطلب"}
                  fill
                  sizes="(max-width: 640px) 100vw, 640px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <p className="text-base text-muted">
            بعد الموافقة سيتاح الصنايعي في الدليل فوراً بنشر تلقائي.
          </p>
        </div>
      )}
    </Modal>
  );
}
