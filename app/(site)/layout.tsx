import { Header } from "@/components/shared/layout/Header";
import { Footer } from "@/components/shared/layout/Footer";
import { BottomNav } from "@/components/shared/layout/BottomNav";
import { SearchModal } from "@/components/search/SearchModal";
import { BackToTop } from "@/components/shared/ui/BackToTop";
import { NotificationsToast } from "@/components/shared/ui/NotificationsToast";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col pb-[calc(env(safe-area-inset-bottom)+56px)] sm:pb-0">
      <Header />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <Footer />
      {/* فراغ موبايل يسمح بظهور آخر الفوتر فوق الشريط السفلي (بدل حشوة داخل الفوتر) */}
      <div className="h-[calc(env(safe-area-inset-bottom)+88px)] sm:hidden" aria-hidden />
      <BottomNav />
      <SearchModal />
      <BackToTop />
      <NotificationsToast />
    </div>
  );
}
