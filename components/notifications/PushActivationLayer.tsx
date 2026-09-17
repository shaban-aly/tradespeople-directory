"use client";

import { useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { addStoredInterest, type ActivationContext } from "@/lib/push/activation";

interface PushActivationLayerProps {
  context?: ActivationContext;
}

/**
 * جسر ربط سياقي لإشعارات الـ Push في الخلفية (التصنيف، البحث...).
 * يقوم بربط التصنيف تلقائياً كاهتمام للزائر أو المسجل بدون أي أزرار متابعة أو تشويش على الواجهة.
 */
export function PushActivationLayer({ context }: PushActivationLayerProps) {
  const { isLoggedIn } = useSession();

  useEffect(() => {
    if (context?.scope === "category" && context.refId) {
      void addStoredInterest(context.refId, isLoggedIn);
    }
  }, [context?.scope, context?.refId, isLoggedIn]);

  return null;
}

