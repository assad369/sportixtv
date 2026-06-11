"use client";

import { useEffect } from "react";
import { ROLE_COOKIE } from "@/lib/auth/constants";

/**
 * Casual-scraping deterrents for visitors: context menu, view-source/devtools
 * shortcuts, text selection. Skipped entirely for admins (role hint cookie).
 *
 * These are deterrents only — they cannot stop a determined user and are
 * never relied on for stream protection (that's the token layer's job).
 */
export function DeterrentProvider() {
  useEffect(() => {
    if (document.cookie.includes(`${ROLE_COOKIE}=admin`)) return;

    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      const blocked =
        k === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C"].includes(k)) ||
        ((e.ctrlKey || e.metaKey) && ["U", "S"].includes(k));
      if (blocked) e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("no-select");
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("no-select");
    };
  }, []);

  return null;
}
