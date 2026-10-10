import Link from "next/link";
import {
  IconStar,
  IconBookmark,
  IconBell,
  IconWrench,
  IconChevronLeft,
} from "@/components/shared/icons";
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";

/** قائمة الأنشطة الرئيسية للعميل في دليل الصنايعية */
const activities = [
  {
    id: "reviews",
    href: "/my-reviews",
    label: "تقييماتي ومراجعاتي",
    description: "تقييمات وآراء كتبتها للصنايعية لمساعدة أهالي السويس",
    icon: IconStar,
    iconClass: "text-warning",
    iconBg: "bg-warning/10 group-hover:bg-warning group-hover:text-on-warning",
  },
  {
    id: "favorites",
    href: "/favorites",
    label: "قائمتي المفضلة",
    description: "الصنايعية والورش المحفوظة للرجوع إليهم بسرعة عند الحاجة",
    icon: IconBookmark,
    iconClass: "text-accent",
    iconBg: "bg-accent/10 group-hover:bg-accent group-hover:text-on-accent",
  },
  {
    id: "notifications",
    href: "/notifications",
    label: "التنبيهات والإشعارات",
    description: "تحديثات طلباتك والردود وتنبيهات الحرفيين في السويس",
    icon: IconBell,
    iconClass: "text-action",
    iconBg: "bg-action/10 group-hover:bg-action group-hover:text-on-action",
  },
  {
    id: "requests",
    href: "/my-requests",
    label: "طلبات الصيانة (طلباتي)",
    description: "متابعة الطلبات المفتوحة والمكتملة وعروض الأسعار من الفنيين",
    icon: IconWrench,
    iconClass: "text-accent",
    iconBg: "bg-accent/10 group-hover:bg-accent group-hover:text-on-accent",
  },
];

export function ActivityList() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
      {/* سطر العنوان الموحد */}
      <PageTitleRow
        title="سجل نشاطاتي"
        description="كل تفاعلاتك وإسهاماتك في دليل صنايعية السويس في مكان واحد"
        backFallback="/profile"
        backLabel="حسابي"
      />

      {/* كروت الأنشطة */}
      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <Link
              key={activity.id}
              href={activity.href}
              className="flex min-h-12 items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-accent hover:bg-accent/5 shadow-xs group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${activity.iconBg} ${activity.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                    {activity.label}
                  </p>
                  <p className="text-xs text-muted truncate">{activity.description}</p>
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