import { IconSettings } from "@/components/shared/icons";
import { ContactRoutingSettingsCard } from "@/components/admin/settings/ContactRoutingSettingsCard";
import { getContactRoutingSettings } from "@/lib/db/settings";

export const metadata = {
  title: "إعدادات الموقع | لوحة التحكم",
};

export default async function AdminSettingsPage() {
  const settings = await getContactRoutingSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <IconSettings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-extrabold text-foreground">
            إعدادات الموقع المركزية
          </h1>
          <p className="text-sm font-semibold text-muted">
            التحكم في التوجيه المركزي للمكالمات والرسائل والإعدادات العامة للمنصة
          </p>
        </div>
      </div>

      <ContactRoutingSettingsCard initialSettings={settings} />
    </div>
  );
}
