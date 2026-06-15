import type { Metadata } from "next";
import { getRecentAndUpcomingEvents } from "@/lib/data/events";
import { EventsTabs } from "@/components/events/EventsTabs";
import { JsonLd } from "@/components/seo/JsonLd";
import { eventsListJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Live Sports Events & Match Schedule — Watch Free",
  description:
    "Live and upcoming sports matches — football, cricket, basketball, tennis and more. Watch every match live online for free in HD. No registration needed.",
  keywords: ["live sports", "sports events", "cricket live", "football live", "match schedule", "watch online free"],
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const events = await getRecentAndUpcomingEvents();
  return (
    <div>
      <JsonLd data={eventsListJsonLd(events)} />
      <h1 className="text-2xl font-bold">Live Sports Events</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Watch live and upcoming sports matches — all free, no sign-up required.
      </p>
      <div className="mt-5">
        <EventsTabs events={events} />
      </div>
    </div>
  );
}
