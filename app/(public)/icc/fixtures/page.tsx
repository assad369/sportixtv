import type { Metadata } from "next";
import { getIccFixtures } from "@/lib/data/icc";
import { iccFixturesJsonLd } from "@/lib/seo/jsonld";
import { IccFixturesList } from "@/components/icc/IccFixturesList";
import { JsonLd } from "@/components/seo/JsonLd";

const title = "ICC Cricket Fixtures 2026 — Men's & Women's Schedule, Times & Live";
const description =
  "Full ICC international cricket schedule 2026 — T20I, ODI and Test matches for Men's and Women's cricket. Dates, venues, kickoff times and free live streaming.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "icc cricket fixtures 2026",
    "icc cricket schedule",
    "mens cricket schedule 2026",
    "womens cricket schedule 2026",
    "icc t20 world cup fixtures",
    "icc odi world cup schedule",
    "icc champions trophy schedule",
    "cricket fixtures today",
    "watch icc cricket live",
    "icc cricket live streaming free",
    "international cricket schedule",
    "cricket match schedule 2026",
  ],
  alternates: { canonical: "/icc/fixtures" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/icc/fixtures",
    siteName: "SportixTV",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function IccFixturesPage() {
  const fixtures = await getIccFixtures({ daysBack: 1, daysAhead: 90 });

  return (
    <div>
      <JsonLd data={iccFixturesJsonLd(fixtures)} />

      <header>
        <div className="flex items-center gap-2.5">
          <span className="section-accent" />
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            ICC Cricket Fixtures 2026
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          International cricket schedule for Men's &amp; Women's cricket — T20I, ODI and
          Test matches with kickoff times, venues and live status. Tap{" "}
          <span className="font-semibold text-brand">Watch Live</span> on any fixture to
          stream it free in HD.
        </p>
      </header>

      <div className="mt-6">
        {fixtures.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-ink-faint">
              No ICC fixtures found for the next 90 days.
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              Fixtures are synced automatically from icc-cricket.com. Check back
              soon or ask your admin to run a manual sync.
            </p>
          </div>
        ) : (
          <IccFixturesList events={fixtures} />
        )}
      </div>
    </div>
  );
}
