import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "@/lib/db/server";
import { ActivityList } from "@/components/activity/ActivityList";

export const metadata: Metadata = {
  title: "سجل نشاطاتي | دليل الصنايعية",
  description: "سجل تفاعلاتك وتقييماتك مع الصنايعية في دليل الصنايعية السويس.",
  robots: { index: false, follow: false },
};

export default async function ActivityPage() {
  const { user } = await getServerSession();

  if (!user) {
    redirect("/login?reason=activity&next=/activity");
  }

  return <ActivityList />;
}