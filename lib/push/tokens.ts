import { createSupabase } from "@/lib/db/client";
import { getCurrentDeviceInfo, type DeviceInfo } from "@/lib/push/device";

export const MIN_TOKEN_LENGTH = 10;
export const MAX_TOKEN_LENGTH = 4096;
export const PUSH_DEVICE_TOKEN_KEY = "push:device_token";

function isValidToken(token: string): boolean {
  return token.length >= MIN_TOKEN_LENGTH && token.length <= MAX_TOKEN_LENGTH;
}

/** تسجيل FCM token للمستخدم الحالي عبر RPC آمن مع بيانات وهوية الجهاز */
export async function registerPushToken(
  token: string,
  device?: Partial<DeviceInfo>,
): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const currentDevice = device ?? getCurrentDeviceInfo();
  const supabase = createSupabase();
  const { error } = await supabase.rpc("register_push_token", {
    p_token: token,
    p_platform: "web",
    p_device_type: currentDevice.deviceType || "desktop",
    p_device_name: currentDevice.deviceName || "",
    p_user_agent: currentDevice.userAgent || "",
  });

  if (!error && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PUSH_DEVICE_TOKEN_KEY, token);
    } catch {
      // تجاهل أخطاء التخزين
    }
  }

  return !error;
}

/** إلغاء تسجيل توكن (المستخدم الحالي فقط) — يُستدعى مع الحذف من الجهاز أو تسجيل الخروج */
export async function unregisterPushToken(token?: string): Promise<boolean> {
  let targetToken = token;
  if (!targetToken && typeof window !== "undefined") {
    try {
      targetToken = window.localStorage.getItem(PUSH_DEVICE_TOKEN_KEY) || undefined;
    } catch {
      // تجاهل
    }
  }
  if (!targetToken || !isValidToken(targetToken)) return false;

  const supabase = createSupabase();
  const { error } = await supabase.rpc("unregister_push_token", {
    p_token: targetToken,
  });

  if (!error && typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(PUSH_DEVICE_TOKEN_KEY);
    } catch {
      // تجاهل
    }
  }

  return !error;
}

export interface UserPushDevice {
  id: string;
  deviceType: string;
  deviceName: string;
  createdAt: string;
  lastSeenAt: string;
}

/** جلب قائمة أجهزة المستخدم المسجلة لاستقبال الإشعارات */
export async function getUserPushDevices(): Promise<UserPushDevice[]> {
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from("user_push_tokens")
    .select("id, device_type, device_name, created_at, last_seen_at")
    .order("last_seen_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    deviceType: row.device_type,
    deviceName: row.device_name,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  }));
}

/** حذف جهاز محدد للمستخدم عبر معرّف السجل */
export async function deletePushDeviceById(deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  const supabase = createSupabase();
  const { error } = await supabase
    .from("user_push_tokens")
    .delete()
    .eq("id", deviceId);
  return !error;
}

/** تسجيل توكن الزائر المجهول واهتماماته عبر RPC آمن */
export async function registerAnonymousPush(
  token: string,
  interests: string[] = [],
): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const supabase = createSupabase();
  const { error } = await supabase.rpc("register_anonymous_push", {
    p_token: token,
    p_interests: interests,
    p_platform: "web",
  });

  if (!error && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PUSH_DEVICE_TOKEN_KEY, token);
    } catch {
      // تجاهل
    }
  }

  return !error;
}

/** إلغاء اشتراك توكن مجهول */
export async function unregisterAnonymousPush(token?: string): Promise<boolean> {
  let targetToken = token;
  if (!targetToken && typeof window !== "undefined") {
    try {
      targetToken = window.localStorage.getItem(PUSH_DEVICE_TOKEN_KEY) || undefined;
    } catch {
      // تجاهل
    }
  }
  if (!targetToken || !isValidToken(targetToken)) return false;

  const supabase = createSupabase();
  const { error } = await supabase.rpc("unregister_anonymous_push", {
    p_token: targetToken,
  });

  if (!error && typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(PUSH_DEVICE_TOKEN_KEY);
    } catch {
      // تجاهل
    }
  }

  return !error;
}

/** تحديث اهتمامات توكن مجهول */
export async function updateAnonymousInterests(
  token: string,
  interests: string[],
): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const supabase = createSupabase();
  const { error } = await supabase.rpc("update_anonymous_interests", {
    p_token: token,
    p_interests: interests,
  });
  return !error;
}

/** متابعة تصنيف للمستخدم المسجل */
export async function subscribeUserInterest(categorySlug: string): Promise<boolean> {
  if (!categorySlug) return false;
  const supabase = createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("user_interest_subscriptions").upsert(
    {
      user_id: user.id,
      category_slug: categorySlug,
    },
    { onConflict: "user_id,category_slug", ignoreDuplicates: true },
  );
  return !error;
}

/** إلغاء متابعة تصنيف للمستخدم المسجل */
export async function unsubscribeUserInterest(categorySlug: string): Promise<boolean> {
  if (!categorySlug) return false;
  const supabase = createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_interest_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("category_slug", categorySlug);
  return !error;
}