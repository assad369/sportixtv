import type { Metadata } from "next";
import { TvIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "You are offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <TvIcon className="size-16 text-ink-faint" />
      <h1 className="text-2xl font-bold">You’re offline</h1>
      <p className="max-w-md text-ink-muted">
        Live streams need an internet connection. Check your network and try
        again.
      </p>
    </div>
  );
}
