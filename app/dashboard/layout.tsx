import { Header } from "@/components/shared/layout/Header";
import { Footer } from "@/components/shared/layout/Footer";
import { BackToTop } from "@/components/shared/ui/BackToTop";

export const metadata = {
  title: "لوحة تحكم الفني | دليل الصنايعية",
  description: "لوحة تحكم خاصة بالفني لإدارة بروفايله ومتابعة إحصائيات تواصل العملاء معه",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 flex flex-col gap-6">
          {children}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
