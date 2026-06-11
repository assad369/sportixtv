"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AdSpotLite } from "@/lib/data/ads";

/**
 * Renders one ad spot.
 * - image: plain banner with link.
 * - html: injected markup; <script> tags inside the snippet are re-created so
 *   ad-network tags (Adsterra, PropellerAds, AdSense <ins> units…) execute.
 * - lazy: defers injection until the slot scrolls near the viewport.
 */
export function AdRenderer({ ad, lazy = false }: { ad: AdSpotLite; lazy?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy || visible) return;
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [lazy, visible]);

  useEffect(() => {
    const host = hostRef.current;
    if (!visible || ad.type !== "html" || !host || !ad.htmlCode) return;
    host.innerHTML = ad.htmlCode;
    // innerHTML-inserted scripts don't run — recreate them.
    for (const old of Array.from(host.querySelectorAll("script"))) {
      const script = document.createElement("script");
      for (const attr of Array.from(old.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }
      script.text = old.text;
      old.replaceWith(script);
    }
    return () => {
      host.innerHTML = "";
    };
  }, [visible, ad]);

  if (ad.type === "image" && ad.imageUrl) {
    const img = (
      <Image
        src={ad.imageUrl}
        alt="Advertisement"
        width={728}
        height={90}
        className="h-auto max-w-full rounded-lg"
        unoptimized
      />
    );
    return (
      <div ref={hostRef} className="flex justify-center">
        {visible &&
          (ad.linkUrl ? (
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              {img}
            </a>
          ) : (
            img
          ))}
      </div>
    );
  }

  return <div ref={hostRef} className="flex justify-center overflow-hidden" />;
}
