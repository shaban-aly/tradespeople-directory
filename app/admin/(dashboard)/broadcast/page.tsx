import { BroadcastForm } from "@/components/admin/broadcast/BroadcastForm";
import { IconBell } from "@/components/shared/icons";

export const metadata = {
  title: "إرسال إشعار جماعي | لوحة التحكم",
};

export default function BroadcastPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <IconBell className="h-5 w-5" />
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

      <BroadcastForm />
    </div>
  );
}
