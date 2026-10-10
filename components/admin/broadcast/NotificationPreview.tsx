import { IconBell, IconLink, IconUser } from "@/components/shared/icons";
import type { BroadcastAudience } from "@/hooks/admin/useAdminBroadcast";

interface NotificationPreviewProps {
  title: string;
  body: string;
  link?: string;
  audience: BroadcastAudience;
  targetUserName?: string;
}

export function NotificationPreview({
  title,
  body,
  link,
  audience,
  targetUserName,
}: NotificationPreviewProps) {
  const getAudienceLabel = () => {
    switch (audience) {
      case "all":
        return "كل المستخدمين";
      case "craftsmen":
        return "الفنيين فقط";
      case "clients":
        return "العملاء فقط";
      case "user_id":
        return targetUserName ? `المستخدم: ${targetUserName}` : "مستخدم محدد";
    }
  };

  const hasContent = Boolean(title.trim() || body.trim());

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-foreground">
          معاينة الإشعار
        </h3>
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">
          {getAudienceLabel()}
        </span>
      </div>

      {/* Simulated Device Notification Bubble */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-background/90 p-4 shadow-sm backdrop-blur-sm">
        {/* Header bar of notification */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-on-accent shadow-xs">
              <IconBell className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-extrabold text-foreground tracking-tight">
              دليل الصنايعية
            </span>
          </div>
          <span className="text-xs font-medium text-muted">الآن</span>
        </div>

        {/* Notification Body */}
        {hasContent ? (
          <div className="space-y-1.5 pt-1">
            <h4 className="font-heading text-sm font-bold text-foreground leading-snug">
              {title.trim() || "بدون عنوان"}
            </h4>
            <p className="whitespace-pre-wrap text-xs text-foreground/85 leading-relaxed">
              {body.trim() || "اكتب نص الإشعار لمعاينته هنا..."}
            </p>

            {link?.trim() && (
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1 text-xs text-accent">
                <IconLink className="h-3 w-3 shrink-0" />
                <span className="truncate font-mono font-medium" dir="ltr">
                  {link.trim()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-muted">
              اكتب عنوان ونص الإشعار لمعاينة مظهره لدى المستخدم فورياً
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        هذا نموذج تقريبي لكيفية ظهور الإشعار في شريط التنبيهات وداخل التطبيق
      </p>
    </div>
  );
}
