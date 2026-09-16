import { createSupabase } from "./client";
import type { Database } from "./database.types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

type Listener = (row: NotificationRow) => void;

/**
 * ناقل Realtime مشترك لكل المستخدم الجاري تسجيل دخوله.
 *
 * السبب: `createSupabase()` عائد client واحد (singleton عبر globalThis) ودالة
 * `.channel(name)` لديه تُرجع نفس القناة لنفس الاسم. لو اشترك مكوّنان مستقلان
 * بنفس الاسم، الثانٍ يجد القناة بعد `subscribe()` فيفشل:
 * "cannot add postgres_changes callbacks ... after subscribe()".
 *
 * هنا: قناة واحدة لكل مستخدم، والأحداث تُوزَّع على كل المستمعين المسجّلين
 * (جرس الهيدر + Toast). عند مغادرة آخر مستمع تُحذف القناة.
 */
const listeners = new Set<Listener>();
let activeUserId: string | null = null;
let channel: RealtimeChannel | null = null;

function createChannel(userId: string): RealtimeChannel {
  const supabase = createSupabase();
  const ch = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as NotificationRow;
        if (row && typeof row.id === "string") {
          listeners.forEach((listener) => listener(row));
        }
      },
    )
    .subscribe();

  return ch;
}

function tearDown() {
  if (channel) {
    void createSupabase().removeChannel(channel);
  }
  channel = null;
  activeUserId = null;
}

export function subscribeToNotifications(userId: string, listener: Listener): () => void {
  listeners.add(listener);

  if (activeUserId !== userId) {
    tearDown();
    activeUserId = userId;
    channel = createChannel(userId);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      tearDown();
    }
  };
}