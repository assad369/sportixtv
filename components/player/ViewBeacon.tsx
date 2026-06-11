"use client";

import { useEffect } from "react";

const RECENT_KEY = "stv:recent";

/** Counts one view per mount and records the channel for "Recently Watched". */
export function ViewBeacon({
  channelId,
  channelSlug,
}: {
  channelId: string;
  channelSlug: string;
}) {
  useEffect(() => {
    const body = JSON.stringify({});
    try {
      if (!navigator.sendBeacon(`/api/channels/${channelId}/view`, body)) {
        fetch(`/api/channels/${channelId}/view`, {
          method: "POST",
          body,
          keepalive: true,
        }).catch(() => undefined);
      }
    } catch {
      // analytics is best-effort
    }

    try {
      const recent: string[] = JSON.parse(
        localStorage.getItem(RECENT_KEY) ?? "[]",
      );
      const next = [
        channelSlug,
        ...recent.filter((s) => s !== channelSlug),
      ].slice(0, 12);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable
    }
  }, [channelId, channelSlug]);

  return null;
}
