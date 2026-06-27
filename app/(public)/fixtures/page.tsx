import type { Metadata } from "next";
import { getWorldCupFixtures } from "@/lib/data/worldcup";
import { FixturesList } from "@/components/worldcup/FixturesList";
import { JsonLd } from "@/components/seo/JsonLd";
import { worldCupFixturesJsonLd } from "@/lib/seo/jsonld";

const title = "FIFA World Cup 2026 Fixtures — Schedule, Kickoff Times & Live";
const description =
  "Full FIFA World Cup 2026 fixtures and schedule — all 104 matches with dates, kickoff times, venues and live status. Watch every World Cup match live online for free in HD.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "fifa world cup 2026 fixtures",
    "world cup 2026 schedule",
    "world cup 2026 match times",
    "world cup fixtures",
    "watch world cup 2026 live",
    "world cup 2026 today matches",
  ],
  alternates: { canonical: "/fixtures" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/fixtures",
    siteName: "SportixTV",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function FixturesPage() {
  const fixtures = await getWorldCupFixtures();

  return (
    <div>
      <JsonLd data={worldCupFixturesJsonLd(fixtures)} />

      <header>
        <div className="flex items-center gap-2.5">
          <span className="section-accent" />
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            FIFA World Cup 2026 Fixtures
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Every match of the FIFA World Cup 2026 — grouped by day with kickoff
          times, venues and live status. Tap{" "}
          <span className="font-semibold text-brand">Watch Live</span> on any
          fixture to stream it free in HD.
        </p>
      </header>

      <div className="mt-6">
        {fixtures.length === 0 ? (
          <p className="py-20 text-center text-sm text-ink-faint">
            Fixtures are being set up. Please check back soon.
          </p>
        ) : (
          <FixturesList events={fixtures} />
        )}
      </div>
    </div>
  );
}
