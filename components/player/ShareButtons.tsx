"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <button
      onClick={share}
      className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-brand/60 hover:text-brand"
    >
      <ShareIcon className="size-4" />
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
