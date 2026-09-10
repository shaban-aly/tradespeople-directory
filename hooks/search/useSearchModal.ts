"use client";

import { useEffect, useState } from "react";

const EVENT_OPEN = "suez:open-search";
const EVENT_CLOSE = "suez:close-search";

/** فتح نافذة البحث السريع من أي مكان بالتطبيق باستخدام أحداث المتصفح القياسية */
export function openSearchModal(initialQuery = "") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(EVENT_OPEN, { detail: { query: initialQuery } }),
    );
  }
}

/** إغلاق نافذة البحث السريع */
export function closeSearchModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_CLOSE));
  }
}

/** Hook روتيني مبسط لإدارة حالة نافذة البحث */
export function useSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  useEffect(() => {
    function handleOpen(event: Event) {
      const customEvent = event as CustomEvent<{ query?: string }>;
      setInitialQuery(customEvent.detail?.query || "");
      setIsOpen(true);
    }

    function handleClose() {
      setIsOpen(false);
      setInitialQuery("");
    }

    window.addEventListener(EVENT_OPEN, handleOpen);
    window.addEventListener(EVENT_CLOSE, handleClose);

    return () => {
      window.removeEventListener(EVENT_OPEN, handleOpen);
      window.removeEventListener(EVENT_CLOSE, handleClose);
    };
  }, []);

  return {
    isOpen,
    initialQuery,
    openSearch: openSearchModal,
    closeSearch: closeSearchModal,
  };
}
