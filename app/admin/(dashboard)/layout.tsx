import { AdminShell } from "@/components/admin/AdminShell";
import { getServerSession } from "@/lib/db/server";
import { fetchAdminNavCounts } from "@/lib/db/admin";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { supabase, user } = await getServerSession();
  const initialCounts = await fetchAdminNavCounts(supabase).catch(() => undefined);

  return (
    <AdminShell userEmail={user?.email} initialCounts={initialCounts}>
      {children}
    </AdminShell>
  );
}
