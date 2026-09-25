import { BroadcastForm } from "@/components/admin/broadcast/BroadcastForm";
import { IconAlert } from "@/components/shared/icons";

export const metadata = {
  title: "إرسال إشعار جماعي | لوحة التحكم",
};

export default function BroadcastPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <IconAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-extrabold text-foreground">
            إرسال إشعار جماعي
          </h1>
          <p className="text-sm font-semibold text-muted">
            إرسال إشعارات فورية (Push Notifications) وداخل التطبيق للمستخدمين
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <BroadcastForm />
        </div>
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-bold text-foreground mb-3">معلومات هامة</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>الإشعار هيوصل للمستخدمين المحددين في نفس اللحظة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>المستخدم اللي فعل الـ Push Notifications هيجيله إشعار على تليفونه</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>لكل مشرف الحق في إرسال 10 إشعارات فقط كل ساعة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>ممكن تحط رابط مباشر لأي صفحة في الموقع أو رابط خارجي</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
