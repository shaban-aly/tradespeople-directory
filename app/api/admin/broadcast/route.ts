import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { consumeRateLimit } from "@/lib/db/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll() { return cookieStore.getAll(); },
        setAll() {} // Read-only in this context
      } 
    }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
    
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // Rate limiting (10 broadcasts per hour)
  const rl = await consumeRateLimit(
    supabase as any, // as any to bypass type matching on rpc Pick if needed, though usually safe
    `admin_broadcast:${data.user.id}`,
    { limit: 10, windowMs: 3600 * 1000 }
  );
  
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "تجاوزت الحد المسموح — انتظر قبل الإرسال مجدداً" },
      { status: 429 }
    );
  }

  let body: unknown;
  try { 
    body = await request.json(); 
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }
  
  const { title, body: msgBody, link, audience, targetUserId } = body as Record<string, unknown>;

  if (!title || !msgBody || !audience) {
    return NextResponse.json({ error: "حقول ناقصة" }, { status: 400 });
  }

  const { data: count, error: rpcError } = await supabase.rpc(
    "broadcast_admin_notification",
    {
      p_title:    String(title),
      p_body:     String(msgBody),
      p_link:     link ? String(link) : null,
      p_audience: String(audience),
      p_user_id:  targetUserId ? String(targetUserId) : null,
    }
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, recipientCount: count });
}
