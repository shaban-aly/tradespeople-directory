import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const globalForSupabase = globalThis as unknown as {
  supabase?: ReturnType<typeof createBrowserClient>;
  readClient?: ReturnType<typeof createClient>;
};

export function createSupabase() {
  if (!globalForSupabase.supabase) {
    globalForSupabase.supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return globalForSupabase.supabase;
}

export function createServerReadClient() {
  if (!globalForSupabase.readClient) {
    globalForSupabase.readClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return globalForSupabase.readClient;
}
