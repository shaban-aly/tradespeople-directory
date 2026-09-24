import Link from "next/link";
import { getServerSession } from "@/lib/db/server";
import type { SessionProfile } from "@/hooks/auth/useSession";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ThemeSettings } from "@/components/profile/ThemeSettings";
import { PushSettingsCard } from "@/components/notifications/PushSettingsCard";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { TourHelpCard } from "@/components/profile/TourHelpCard";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import {
  IconActivity,
  IconStar,
  IconWrench,
  IconChevronLeft,
  IconUser,
  IconArrow,
  IconShieldCheck,
} from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

export const metadata = {
  title: "الملف الشخصي والإعدادات | دليل الصنايعية",
  description: "إدارة حسابك، المفضلة، التقييمات، وضبط إعدادات الإشعارات والمظهر",
};

export default async function ProfilePage() {
  const { supabase, user } = await getServerSession();

  // إذا لم يكن المستخدم مسجل الدخول
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <IconUser className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
            الملف الشخصي والإعدادات
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted leading-relaxed">
            سجّل دخولك بحساب جوجل لتتمكن من إدارة تقييماتك، حفظ الصنايعية، وضبط تفضيلاتك.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center">
            <GoogleSignInButton redirectTo="/profile" />
          </div>

          <div className="mt-6 border-t border-border/50 pt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent transition-colors hover:underline"
            >
              <IconArrow className="h-3.5 w-3.5" />
              <span>العودة لتصفح دليل الصنايعية</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // جلب البروفايل وعدد المفضلة والتقييمات بالتوازي
  const [profileResult, favoritesResult, reviewsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, craftsman_id, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profileData = profileResult.data;
  const favoritesCount = favoritesResult.count ?? 0;
  const reviewsCount = reviewsResult.count ?? 0;

  const profile: SessionProfile | null = profileData
    ? {
        role: profileData.role as SessionProfile["role"],
        craftsmanId: profileData.craftsman_id ?? null,
        displayName: profileData.display_name ?? null,
        avatarUrl: profileData.avatar_url ?? null,
      }
    : null;

  const isCraftsman = profile?.role === "craftsman";
  const isAdmin = profile?.role === "admin";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8 space-y-6">
      {/* مسار التنقل */}
      <nav
        aria-label="مسار التنقل"
        className="flex items-center gap-1.5 text-sm text-muted"
      >
        <Link href="/" className="font-bold transition-colors hover:text-accent">
          الرئيسية
        </Link>
        <span aria-hidden>·</span>
        <span className="font-bold text-foreground">الملف الشخصي والإعدادات</span>
      </nav>

      {/* 1. بطاقة المستخدم الأساسية مع عدادات النشاط والأفاتار الذكي */}
      <ProfileCard
        user={user}
        profile={profile}
        favoritesCount={favoritesCount}
        reviewsCount={reviewsCount}
      />

      {/* 2. مجموعة النشاط والتفاعل (My Activity Group) */}
      <div className="space-y-2">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-muted">
          نشاطاتي وتفاعلاتي
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs divide-y divide-border/60">
          {/* رابط المفضلة والمحفوظات */}
          <Link
            href="/favorites"
            className="flex items-center justify-between p-4 transition-colors hover:bg-accent/5 group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                <IconStar className="h-5 w-5 fill-current" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                  المفضلة والمحفوظات
                </p>
                <p className="text-xs text-muted truncate">
                  قائمة الفنيين المحفوظين لديك للوصول السريع
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {toArabicDigits(favoritesCount)} فني
              </span>
              <IconChevronLeft className="h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-accent" />
            </div>
          </Link>

          {/* رابط صفحة نشاطاتي */}
          <Link
            href="/activity"
            className="flex items-center justify-between p-4 transition-colors hover:bg-accent/5 group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent">
                <IconActivity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                  سجل نشاطاتي وتقييماتي
                </p>
                <p className="text-xs text-muted truncate">
                  عرض وإدارة المراجعات والتقييمات التي كتبتها للصنايعية
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-muted/20 px-2.5 py-0.5 text-xs font-bold text-foreground">
                {toArabicDigits(reviewsCount)} تقييم
              </span>
              <IconChevronLeft className="h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-accent" />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. مجموعة التفضيلات والتحكم (Preferences Group) */}
      <div className="space-y-2">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-muted">
          التفضيلات والمظهر
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xs space-y-4 divide-y divide-border/60">
          <ThemeSettings />
          <PushSettingsCard />
        </div>
      </div>

      {/* 4. مجموعة المساعدة والدليل (Help & Guide Group) */}
      <div className="space-y-2">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-muted">
          المساعدة والإرشاد
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <TourHelpCard />
        </div>
      </div>

      {/* 5. البطاقة المهنية حسب الدور (Role Hub) — بدون أي تكرار */}
      {isAdmin ? (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 transition-all hover:border-amber-500 hover:bg-amber-500/10 shadow-xs group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <IconShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground group-hover:text-amber-600 transition-colors">
                لوحة تحكم الإدارة الشاملة
              </p>
              <p className="text-xs text-muted truncate">
                متابعة المنصة وإدارة الصنايعية والمراجعات والمستخدمين
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <span className="hidden sm:inline">الانتقال للإدارة</span>
            <IconChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </div>
        </Link>
      ) : isCraftsman ? (
        <Link
          href="/dashboard"
          className="flex items-center justify-between rounded-2xl border border-action/30 bg-action/5 p-4 sm:p-5 transition-all hover:border-action hover:bg-action/10 shadow-xs group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-action/15 text-action">
              <IconWrench className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground group-hover:text-action transition-colors">
                لوحة تحكم الفني والإحصائيات
              </p>
              <p className="text-xs text-muted truncate">
                متابعة اتصالات العملاء ونسب المشاهدات وتعديل بيانات ملفك
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-action">
            <span className="hidden sm:inline">إدارة حسابك</span>
            <IconChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </div>
        </Link>
      ) : (
        <Link
          href="/join"
          className="flex items-center justify-between rounded-2xl border border-action/30 bg-action/5 p-4 sm:p-5 transition-all hover:border-action hover:bg-action/10 shadow-xs group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-action/15 text-action">
              <IconWrench className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground group-hover:text-action transition-colors">
                هل تقدم خدمة أو مهنة في السويس؟
              </p>
              <p className="text-xs text-muted truncate">
                سجّل كصنايعي واكسب زبائن جدد ومكالمات مباشرة بدون عمولات
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-action">
            <span className="hidden sm:inline">انضم كصنايعي</span>
            <IconChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </div>
        </Link>
      )}

      {/* 6. زر تسجيل الخروج الأنيق */}
      <div className="pt-2">
        <SignOutButton />
      </div>
    </div>
  );
}