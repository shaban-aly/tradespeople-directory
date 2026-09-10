import { Header } from "@/components/shared/layout/Header";
import { Footer } from "@/components/shared/layout/Footer";
import { BottomNav } from "@/components/shared/layout/BottomNav";
import { SearchModal } from "@/components/search/SearchModal";
import { BackToTop } from "@/components/shared/ui/BackToTop";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <Footer />
      <BottomNav />
      <SearchModal />
      <BackToTop />
    </div>
  );
}
