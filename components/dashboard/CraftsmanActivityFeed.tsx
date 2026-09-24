import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { toArabicDigits, formatRelativeTimeArabic } from "@/lib/utils/format";
import type { CraftsmanActivityItem } from "@/lib/db/craftsman-dashboard";

interface CraftsmanActivityFeedProps {
  items?: CraftsmanActivityItem[];
}

export function CraftsmanActivityFeed({
  items = [],
}: CraftsmanActivityFeedProps) {
  const hasItems = items.length > 0;
  const whatsappCount = items.filter((i) => i.contactMethod === "whatsapp").length;
  const phoneCount = items.filter((i) => i.contactMethod === "phone").length;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      {/* رأس القسم */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-lg font-bold text-foreground">
              سجل التواصل الأخير
            </h3>
            {hasItems && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                {toArabicDigits(items.length)} حركة
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            العملاء الذين نقروا على رقم هاتفك أو راسلوك عبر واتساب (آخر 30 يوماً)
          </p>
        </div>

        {hasItems && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <IconWhatsApp className="h-3.5 w-3.5" />
              {toArabicDigits(whatsappCount)} واتساب
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-accent">
              <IconPhone className="h-3.5 w-3.5" />
              {toArabicDigits(phoneCount)} اتصال
            </span>
          </div>
        )}
      </div>

      {/* المحتوى */}
      {!hasItems ? (
        <div className="pt-4">
          <EmptyState
            icon={<IconPhone className="h-6 w-6 text-muted" />}
            title="لا توجد تفاعلات مسجلة مؤخراً"
            description="ستظهر هنا العمليات فور قيام العملاء بالنقر على زر الاتصال بك أو مراسلتك على واتساب."
          />
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border/60">
          {items.map((item) => {
            const isWhatsapp = item.contactMethod === "whatsapp";
            const isAuthenticated = item.userStatus === "authenticated";

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 transition-colors hover:bg-background/40 rounded-xl px-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isWhatsapp
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {isWhatsapp ? (
                      <IconWhatsApp className="h-5 w-5" />
                    ) : (
                      <IconPhone className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-foreground">
                      <span className="font-bold">
                        {isWhatsapp
                          ? "تم التواصل معك عبر واتساب"
                          : "تم طلب الاتصال برقم هاتفك"}
                      </span>
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          isAuthenticated
                            ? "bg-accent/15 text-accent"
                            : "bg-muted/15 text-muted"
                        }`}
                      >
                        {isAuthenticated ? "مستخدم مسجل" : "زائر للموقع"}
                      </span>
                    </div>

                    <div className="mt-0.5 text-[11px] text-muted sm:text-xs">
                      {new Date(item.createdAt).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-left text-xs font-medium text-muted">
                  {formatRelativeTimeArabic(item.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
