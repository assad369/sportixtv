import type { Metadata } from "next";
import { Suspense } from "react";
import { searchChannels } from "@/lib/data/channels";
import { ChannelGrid } from "@/components/channels/ChannelGrid";
import { ChannelGridSkeleton } from "@/components/channels/ChannelGridSkeleton";
import { SearchIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Search Channels",
  robots: { index: false },
};

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  if (!q.trim()) {
    return (
      <p className="py-12 text-center text-sm text-ink-faint">
        Type a channel name to search.
      </p>
    );
  }
  const results = await searchChannels(q);
  return (
    <>
      <p className="mb-4 text-sm text-ink-muted">
        {results.length} result{results.length === 1 ? "" : "s"} for “{q.trim()}”
      </p>
      <ChannelGrid channels={results} emptyText="No channels match your search." />
    </>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Search</h1>
      <form action="/search" method="GET" className="mt-4 max-w-xl">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            name="q"
            placeholder="Search channels…"
            className="h-12 w-full rounded-xl border border-edge bg-surface pl-11 pr-4 text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
        </div>
      </form>
      <div className="mt-6">
        <Suspense fallback={<ChannelGridSkeleton count={6} />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
