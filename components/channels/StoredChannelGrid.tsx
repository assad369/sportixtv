"use client";

import { useEffect, useState } from "react";
import type { ChannelLite } from "@/lib/data/channels";
import { ChannelGrid } from "./ChannelGrid";
import { ChannelGridSkeleton } from "./ChannelGridSkeleton";

/** Renders channels for slugs stored in localStorage (favorites / recent). */
export function StoredChannelGrid({
  storageKey,
  emptyText,
}: {
  storageKey: string;
  emptyText: string;
}) {
  const [channels, setChannels] = useState<ChannelLite[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let slugs: string[] = [];
      try {
        slugs = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      } catch {
        // ignore
      }
      let result: ChannelLite[] = [];
      if (slugs.length > 0) {
        try {
          const res = await fetch("/api/channels/by-slugs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs }),
          });
          if (res.ok) result = (await res.json()).channels ?? [];
        } catch {
          // network error — show empty
        }
      }
      if (!cancelled) setChannels(result);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  if (channels === null) return <ChannelGridSkeleton count={6} />;
  return <ChannelGrid channels={channels} emptyText={emptyText} />;
}
