"use client";

import { useState } from "react";
import { FlagIcon } from "@/components/icons";

export function ReportButton({ channelId }: { channelId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const report = async () => {
    if (status !== "idle") return;
    setStatus("sending");
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, message: "Stream not working" }),
      });
    } catch {
      // best-effort
    }
    setStatus("sent");
  };

  return (
    <button
      onClick={report}
      disabled={status !== "idle"}
      className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-warn/60 hover:text-warn disabled:opacity-60"
    >
      <FlagIcon className="size-4" />
      {status === "sent" ? "Reported — thanks!" : "Report broken stream"}
    </button>
  );
}
