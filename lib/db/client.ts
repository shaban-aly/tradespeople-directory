import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const globalForSupabase = globalThis as unknown as {
  supabase?: ReturnType<typeof createBrowserClient<Database>>;
  readClient?: ReturnType<typeof createClient<Database>>;
};

export function createSupabase() {
  if (!globalForSupabase.supabase) {
    globalForSupabase.supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return globalForSupabase.supabase;
}

export function createServerReadClient() {
  if (!globalForSupabase.readClient) {
    globalForSupabase.readClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return globalForSupabase.readClient;
}
