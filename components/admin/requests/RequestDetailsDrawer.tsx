import Image from "next/image";
import { Drawer } from "@/components/admin/Drawer";
import { IconUsers } from "@/components/shared/icons";
import type { JoinRequestRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function RequestDetailsDrawer({
  request,
  open,
  onClose,
}: {
  request: JoinRequestRow | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={request?.type === "register" ? "تفاصيل طلب التسجيل" : "تفاصيل البلاغ"}
    >
      {request && (
        <div className="grid gap-3 text-base text-muted">
          <p>
            <span className="font-bold text-foreground">الحالة: </span>
            {request.status === "pending"
              ? "معلق"
              : request.status === "approved"
                ? "مقبول"
                : "مرفوض"}
          </p>
          <p>
            <span className="font-bold text-foreground">النوع: </span>
            {request.type === "register" ? "طلب تسجيل" : "بلاغ"}
          </p>
          <p>
            <span className="font-bold text-foreground">التاريخ: </span>
            {toArabicDigits(request.created_at)}
          </p>
          {request.type === "register" ? (
            <>
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
              {request.whatsapp && (
                <p dir="ltr" className="text-right">
                  <span className="font-bold text-foreground">واتساب: </span>
                  {request.whatsapp}
                </p>
              )}
              {request.description && (
                <p>
                  <span className="font-bold text-foreground">الوصف: </span>
                  {request.description}
                </p>
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
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                  <Image
                    src={request.image_url}
                    alt={request.name ?? "صورة الطلب"}
                    fill
                    sizes="(max-width: 640px) 100vw, 640px"
                    className="object-cover"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <p>
                <span className="font-bold text-foreground">الصنايعي: </span>
                {request.craftsman_name}
              </p>
              <p dir="ltr" className="text-right">
                <span className="font-bold text-foreground">رقم المبلغ: </span>
                {request.phone}
              </p>
              <p>
                <span className="font-bold text-foreground">المشكلة: </span>
                {request.report_message}
              </p>
            </>
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
