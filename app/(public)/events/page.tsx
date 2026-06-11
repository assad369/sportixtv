import type { Metadata } from "next";
import { getRecentAndUpcomingEvents } from "@/lib/data/events";
import { EventsTabs } from "@/components/events/EventsTabs";

export const metadata: Metadata = {
  title: "Live Sports Events & Match Schedule",
  description:
    "Live and upcoming sports matches — football, cricket and more. Watch every match live online for free.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const events = await getRecentAndUpcomingEvents();
  return (
    <div>
      <h1 className="text-2xl font-bold">Sports Events</h1>
      <div className="mt-5">
        <EventsTabs events={events} />
      </div>
    </div>
  );
}
