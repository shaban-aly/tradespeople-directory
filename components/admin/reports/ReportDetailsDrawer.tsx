import { Drawer } from "@/components/admin/Drawer";
import { DetailField } from "@/components/admin/ui/DetailField";
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
          <DetailField label="الحالة">
            {report.status === "pending"
              ? "معلق"
              : report.status === "reviewed"
                ? "تمت المراجعة"
                : "مغلق"}
          </DetailField>
          <DetailField label="التاريخ">
            {toArabicDigits(report.created_at)}
          </DetailField>
          <DetailField label="الصنايعي">{report.craftsman_name}</DetailField>
          {report.phone && (
            <DetailField label="رقم المبلّغ" dir="ltr" className="text-right">
              {report.phone}
            </DetailField>
          )}
          {report.reporter_user_id && (
            <DetailField label="المبلّغ">
              مستخدم مسجّل (تم التحقق من حسابه)
            </DetailField>
          )}
          <DetailField label="المشكلة">{report.message}</DetailField>
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