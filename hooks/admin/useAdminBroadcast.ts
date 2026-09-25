"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type BroadcastAudience = "all" | "craftsmen" | "clients" | "user_id";

export interface BroadcastData {
  title: string;
  body: string;
  link?: string;
  audience: BroadcastAudience;
  targetUserId?: string;
}

export function useAdminBroadcast() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const sendBroadcast = async (data: BroadcastData) => {
    setLoading(true);
    setError(null);
    setSuccessCount(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "حدث خطأ غير معروف");
      }

      setSuccessCount(result.recipientCount);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير معروف");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendBroadcast,
    loading,
    error,
    successCount,
  };
}
