import { channels } from "@/lib/db/collections";
import { requireSession } from "@/lib/auth/session";
import { EventForm } from "@/components/admin/EventForm";

export default async function NewEventPage() {
  await requireSession();
  const col = await channels();
  const chs = await col
    .find({}, { projection: { name: 1 } })
    .sort({ name: 1 })
    .toArray();

  return (
    <div>
      <h1 className="text-2xl font-bold">New Event</h1>
      <div className="mt-6">
        <EventForm
          channels={chs.map((c) => ({ id: c._id.toHexString(), name: c.name }))}
          initial={{
            title: "",
            sport: "",
            league: "",
            teamAName: "",
            teamALogo: "",
            teamBName: "",
            teamBLogo: "",
            startsAt: "",
            endsAt: "",
            forcedStatus: "",
            channelIds: [],
            isFeatured: false,
          }}
        />
      </div>
    </div>
  );
}
