import { Header } from "@/components/shared/layout/Header";
import { Footer } from "@/components/shared/layout/Footer";
import { BottomNav } from "@/components/shared/layout/BottomNav";
import { SearchModal } from "@/components/search/SearchModal";
import { BackToTop } from "@/components/shared/ui/BackToTop";
import { NotificationsToast } from "@/components/shared/ui/NotificationsToast";
import { ButtonLink } from "@/components/shared/ui/Button";
import { NotFoundTracker } from "@/components/shared/NotFoundTracker";
import {
  IconArrow,
  IconGrid,
  IconHome,
  IconPhone,
  IconSearch,
  IconWrench,
} from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col pb-[calc(env(safe-area-inset-bottom)+56px)] sm:pb-0">
      <NotFoundTracker />
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-card sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 text-accent">
            <div className="relative">
              <IconSearch className="h-9 w-9" />
              <IconWrench className="absolute -left-2 -top-2 h-4 w-4 text-action" />
            </div>
          </div>

          <h1 className="font-heading text-5xl font-extrabold text-foreground">
            {toArabicDigits(404)}
          </h1>
          <p className="mt-3 font-heading text-xl font-bold text-foreground">
            الصفحة مش موجودة
          </p>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted">
            اللي بتدوّر عليه مش هنا دلوقتي — يمكن الرابط اتغيّر أو الصفحة اتشالت.
            جرّب ترجع للرئيسية أو تتصفح التصنيفات.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <ButtonLink href="/" variant="primary" size="lg">
              <IconHome className="h-5 w-5" />
              الرئيسية
            </ButtonLink>
            <ButtonLink href="/categories" variant="outline" size="lg">
              <IconGrid className="h-5 w-5" />
              التصنيفات
            </ButtonLink>
            <ButtonLink href="/#contact" variant="ghost" size="lg">
              <IconPhone className="h-5 w-5" />
              تواصل معنا
            </ButtonLink>
          </div>

          <p className="mt-6">
            <ButtonLink href="/" variant="ghost" size="md" className="gap-1.5">
              <IconArrow className="h-4 w-4" />
              ارجع للصفحة الرئيسية
            </ButtonLink>
          </p>
        </div>
      </main>
      <Footer />
      <div className="h-[calc(env(safe-area-inset-bottom)+88px)] sm:hidden" aria-hidden />
      <BottomNav />
      <SearchModal />
      <BackToTop />
      <NotificationsToast />
    </div>
  );
}