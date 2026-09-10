import Link from "next/link";
import {
  IconStar,
  IconChevronLeft,
} from "@/components/shared/icons";

/** قائمة الأنشطة — أضف هنا أي نشاط جديد بسهولة */
const activities = [
  {
    id: "reviews",
    href: "/activity/reviews",
    label: "تقييماتي ومراجعاتي",
    description: "تقييمات وآراء كتبتها للصنايعية لمساعدة أهالي السويس",
    icon: IconStar,
    iconClass: "text-amber-500",
    iconBg: "bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-white",
  },
];

export function ActivityList() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
      {/* مسار التنقل */}
      <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="font-bold transition-colors hover:text-accent">
          الرئيسية
        </Link>
        <span aria-hidden>·</span>
        <Link href="/profile" className="font-bold transition-colors hover:text-accent">
          حسابي
        </Link>
        <span aria-hidden>·</span>
        <span className="font-bold text-foreground">نشاطاتي</span>
      </nav>

      {/* هيدر الصفحة */}
      <div className="border-b border-border pb-5">
        <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
          سجل نشاطاتي
        </h1>
        <p className="mt-1 text-sm text-muted">
          كل تفاعلاتك وإسهاماتك في دليل صنايعية السويس في مكان واحد
        </p>
      </div>

      {/* كروت الأنشطة */}
      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <Link
              key={activity.id}
              href={activity.href}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-accent hover:bg-accent/5 shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${activity.iconBg} ${activity.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                    {activity.label}
                  </p>
                  <p className="text-xs text-muted">{activity.description}</p>
                </div>
              </div>
              <IconChevronLeft className="h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-accent shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}