import { Suspense } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { fetchTheSportsDbLeagues } from "@/lib/sync/adapters/thesportsdb";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * League Finder — read-only helper so admins can look up TheSportsDB league IDs
 * (the providerLeagueId values a source needs). Free key "123" is enough.
 */

async function Results({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; sport?: string }>;
}) {
  const { country = "", sport = "" } = await searchParams;
  if (!country.trim() || !sport.trim()) {
    return (
      <p className="text-sm text-ink-faint">
        Enter a country and sport (e.g. England / Soccer) to list leagues with
        their IDs.
      </p>
    );
  }

  let leagues: { id: string; label: string; season?: string }[] = [];
  let error = "";
  try {
    leagues = await fetchTheSportsDbLeagues(
      (url) => fetch(url, { cache: "no-store" }).then((r) => r.json()),
      "123",
      country,
      sport,
    );
  } catch {
    error = "Could not reach TheSportsDB. Try again in a moment.";
  }

  if (error) return <p className="text-sm text-live">{error}</p>;
  if (leagues.length === 0) {
    return (
      <p className="text-sm text-ink-faint">
        No leagues found for “{country} / {sport}”.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-edge">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="bg-surface text-left text-ink-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">League</th>
            <th className="px-4 py-2.5 font-medium">idLeague</th>
            <th className="px-4 py-2.5 font-medium">Sport</th>
            <th className="px-4 py-2.5 font-medium">Competition line</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge">
          {leagues.map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-2.5 font-medium">{l.label}</td>
              <td className="px-4 py-2.5 text-ink-muted">{l.id}</td>
              <td className="px-4 py-2.5 text-ink-muted">{l.season ?? "—"}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-ink-muted">
                {l.id} | {l.label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function LeagueFinderPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; sport?: string }>;
}) {
  await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/autopilot/sources"
          className="text-sm text-brand hover:underline"
        >
          ← Sources
        </Link>
        <h1 className="mt-2 text-2xl font-bold">League Finder</h1>
        <p className="text-sm text-ink-muted">
          Find TheSportsDB league IDs, then paste the “competition line” into a
          source’s Competitions box.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Country</label>
          <Input name="country" placeholder="England" defaultValue="" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Sport</label>
          <Input name="sport" placeholder="Soccer" defaultValue="" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <Suspense
        fallback={
          <div className="size-6 animate-spin rounded-full border-2 border-edge border-t-brand" />
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
