"use client";

import { useEffect, useRef } from "react";

/**
 * Opens the popunder ad's link once per browser session, on the first user
 * click anywhere. Only mounted when settings.popunderEnabled and a popunder
 * spot with a linkUrl exists.
 */
export function Popunder({ linkUrl }: { linkUrl: string }) {
  const firedRef = useRef(false);

  useEffect(() => {
    const KEY = "stv:popunder";
    if (sessionStorage.getItem(KEY)) return;

    const onClick = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      sessionStorage.setItem(KEY, "1");
      try {
        window.open(linkUrl, "_blank", "noopener");
      } catch {
        // popup blocked — fine
      }
      document.removeEventListener("click", onClick);
    };
    document.addEventListener("click", onClick, { once: false });
    return () => document.removeEventListener("click", onClick);
  }, [linkUrl]);

  return null;
}
