"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ZONE = "11146144";
const SRC = "https://al5sm.com/tag.min.js";

export function MonatagPopunder() {
  const pathname = usePathname();

  useEffect(() => {
    const script = document.createElement("script");
    script.dataset.zone = ZONE;
    script.src = SRC;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [pathname]);

  return null;
}
