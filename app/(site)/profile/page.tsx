import Link from "next/link";
import { getServerSession } from "@/lib/db/server";
import type { SessionProfile } from "@/hooks/auth/useSession";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ThemeSettings } from "@/components/profile/ThemeSettings";
import { PushSettingsCard } from "@/components/notifications/PushSettingsCard";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import {
  IconActivity,
  IconStar,
  IconWrench,
  IconChevronLeft,
  IconUser,
  IconArrow,
} from "@/components/shared/icons";

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

  const { data } = await supabase
    .from("profiles")
    .select("role, craftsman_id, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const profile: SessionProfile | null = data
    ? {
        role: data.role as SessionProfile["role"],
        craftsmanId: data.craftsman_id ?? null,
        displayName: data.display_name ?? null,
        avatarUrl: data.avatar_url ?? null,
      }
    : null;

  const isCraftsman = profile?.role === "craftsman";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
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

      {/* بطاقة المستخدم الأساسية */}
      <ProfileCard user={user} profile={profile} />

      {/* قائمة الإعدادات والأقسام بنمط كروت مضغوطة واحترافية */}
      <div className="space-y-3">
        {/* رابط صفحة نشاطاتي */}
        <Link
          href="/activity"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-accent hover:bg-accent/5 shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent">
              <IconActivity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                سجل نشاطاتي
              </p>
              <p className="text-xs text-muted">
                عرض وإدارة المراجعات والتقييمات التي كتبتها للصنايعية
              </p>
            </div>
          </div>
          <IconChevronLeft className="h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-accent" />
        </Link>

        {/* رابط المفضلة والمحفوظات */}
        <Link
          href="/favorites"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-accent hover:bg-accent/5 shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
              <IconStar className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                المفضلة والمحفوظات
              </p>
              <p className="text-xs text-muted">
                قائمة الفنيين المحفوظين لديك للوصول السريع
              </p>
            </div>
          </div>
          <IconChevronLeft className="h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-accent" />
        </Link>

        {/* قسم مظهر التطبيق المدمج والأنيق */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <ThemeSettings />
        </div>

        {/* إعدادات إشعارات المتصفح — التفعيل تلقائي عند أول تفاعل؛ الإيقاف من هنا فقط */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <PushSettingsCard />
        </div>

        {/* خيار خاص بأصحاب المهن */}
        {!isCraftsman ? (
          <Link
            href="/join"
            className="flex items-center justify-between rounded-2xl border border-action/30 bg-action/5 p-4 transition-all hover:border-action hover:bg-action/10 shadow-xs group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-action/15 text-action">
                <IconWrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground group-hover:text-action transition-colors">
                  انضم كصنايعي في دليل السويس
                </p>
                <p className="text-xs text-muted">
                  سجل مهنتك واكسب زبائن جدد بدون وسيط أو عمولات
                </p>
              </div>
            </div>
            <IconChevronLeft className="h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-action" />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-2xl border border-action/30 bg-action/5 p-4 transition-all hover:border-action hover:bg-action/10 shadow-xs group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-action/15 text-action">
                <IconWrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground group-hover:text-action transition-colors">
                  لوحة تحكم الفني والإحصائيات
                </p>
                <p className="text-xs text-muted">
                  متابعة المشاهدات والمتواصلين وتعديل بيانات ملفك
                </p>
              </div>
            </div>
            <IconChevronLeft className="h-5 w-5 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-action" />
          </Link>
        )}
      </div>

      {/* زر تسجيل الخروج الأنيق */}
      <div className="pt-2">
        <SignOutButton />
      </div>
    </div>
  );
}