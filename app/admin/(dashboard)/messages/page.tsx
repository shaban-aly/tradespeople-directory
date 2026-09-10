import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchMessages } from "@/lib/db/admin";
import { MessagesSection } from "./MessagesSection";

export default async function MessagesPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const messages = await fetchMessages(supabase);

  return <MessagesSection initialMessages={messages} />;
}