"use client";

import { useCallback, useRef, useState } from "react";

// هوك نسخ النص إلى الحافظة مع حالة «تم النسخ» وfallback للمتصفحات القديمة.
// مستخدم في زر نسخ الهاتف وأزرار المشاركة.
export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      let ok = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }

      if (!ok) {
        // Fallback للمتصفحات الأقدم / السياقات غير الآمنة
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          ok = true;
        } catch {
          ok = false;
        }
        document.body.removeChild(textarea);
      }

      if (ok) {
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetMs);
      }
      return ok;
    },
    [resetMs],
  );

  return { copied, copy };
}