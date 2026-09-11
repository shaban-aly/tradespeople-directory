import { Drawer } from "@/components/admin/Drawer";
import { IconAlert } from "@/components/shared/icons";
import type { ReportRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function ReportDetailsDrawer({
  report,
  open,
  onClose,
}: {
  report: ReportRow | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} title="تفاصيل البلاغ">
      {report && (
        <div className="grid gap-3 text-base text-muted">
          <p>
            <span className="font-bold text-foreground">الحالة: </span>
            {report.status === "pending"
              ? "معلق"
              : report.status === "reviewed"
                ? "تمت المراجعة"
                : "مغلق"}
          </p>
          <p>
            <span className="font-bold text-foreground">التاريخ: </span>
            {toArabicDigits(report.created_at)}
          </p>
          <p>
            <span className="font-bold text-foreground">الصنايعي: </span>
            {report.craftsman_name}
          </p>
          {report.phone && (
            <p dir="ltr" className="text-right">
              <span className="font-bold text-foreground">رقم المبلّغ: </span>
              {report.phone}
            </p>
          )}
          {report.reporter_user_id && (
            <p>
              <span className="font-bold text-foreground">المبلّغ: </span>
              مستخدم مسجّل (تم التحقق من حسابه)
            </p>
          )}
          <p>
            <span className="font-bold text-foreground">المشكلة: </span>
            {report.message}
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-danger/10 p-4 text-danger">
            <IconAlert className="h-6 w-6 shrink-0" />
            <p className="text-base">
              راجع البلاغ وتواصل مع الطرفين قبل اتخاذ قرار الإغلاق.
            </p>
          </div>
        </div>
      )}
    </Drawer>
  );
}