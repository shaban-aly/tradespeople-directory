import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchAdminUsers } from "@/lib/db/admin";
import { UsersSection } from "@/components/admin/users/UsersSection";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const users = await fetchAdminUsers(supabase);

  return <UsersSection initialUsers={users} />;
}
