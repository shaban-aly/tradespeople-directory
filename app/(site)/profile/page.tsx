import { getServerSession } from "@/lib/db/server";
import { getProfileOverview } from "@/lib/db/profile";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";
import { SignInCard } from "@/components/profile/SignInCard";
import { ProfileGroup } from "@/components/profile/ProfileGroup";
import { ActivityGroup } from "@/components/profile/ActivityGroup";
import { ActivityLink } from "@/components/profile/ActivityLink";
import { ThemeSettings } from "@/components/profile/ThemeSettings";
import { PushSettingsCard } from "@/components/notifications/PushSettingsCard";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { PwaInstallCard } from "@/components/profile/PwaInstallCard";

export const metadata = {
  title: "الملف الشخصي والإعدادات | دليل الصنايعية",
  description: "إدارة حسابك، المفضلة، التقييمات، وضبط إعدادات الإشعارات والمظهر",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const { supabase, user } = await getServerSession();

  if (!user) return <SignInCard />;

  const overview = await getProfileOverview(supabase, user.id);
  const role = overview.profile?.role ?? "client";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* سطر العنوان الموحد بعرض الهيدر العام */}
      <PageTitleRow
        title="حسابي"
        description="الملف الشخصي والإعدادات"
        backFallback="/"
        backLabel="رجوع للرئيسية"
      />

      {/* التقسيمة الرئيسية: عمودان متوازنان على الديسكتوب، وترتيب رأسي انسيابي على الموبايل */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* العمود الجانبي الأيمن: الهوية والمؤشرات الحيوية (5 أعمدة) */}
        <div className="lg:col-span-5 space-y-6">
          {/* كارت الهوية الموحد مع زر الإجراء الرئيسي */}
          <ProfileCard
            user={user}
            profile={overview.profile}
          />

          {/* شريط المؤشرات الحيوية المدمج */}
          <ActivityGroup
            role={role}
            favoritesCount={overview.favoritesCount}
            reviewsCount={overview.reviewsCount}
          />
        </div>

        {/* العمود الرئيسي الأيسر: الإعدادات والأمان (7 أعمدة) */}
        <div className="lg:col-span-7 space-y-6">
          {/* سجل الأنشطة والتفاعل */}
          <ProfileGroup title="النشاط والتفاعل">
            <ActivityLink />
          </ProfileGroup>

          {/* إعدادات التطبيق والمظهر والتثبيت */}
          <ProfileGroup title="إعدادات التطبيق والمظهر">
            <div className="px-4 py-3.5">
              <ThemeSettings />
            </div>
            <div className="px-4 py-3.5">
              <PushSettingsCard />
            </div>
            <PwaInstallCard />
          </ProfileGroup>

          {/* إدارة الحساب والأمان */}
          <ProfileGroup title="إدارة الحساب والأمان">
            <SignOutButton />
          </ProfileGroup>
        </div>
      </div>
    </div>
  );
}
