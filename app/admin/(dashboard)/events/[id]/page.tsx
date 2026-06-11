import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { channels, events } from "@/lib/db/collections";
import { requireSession } from "@/lib/auth/session";
import { EventForm } from "@/components/admin/EventForm";

function toLocalInput(date: Date | null | undefined): string {
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const [evCol, chCol] = await Promise.all([events(), channels()]);
  const [event, chs] = await Promise.all([
    evCol.findOne({ _id: new ObjectId(id) }),
    chCol.find({}, { projection: { name: 1 } }).sort({ name: 1 }).toArray(),
  ]);
  if (!event) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit Event</h1>
      <div className="mt-6">
        <EventForm
          channels={chs.map((c) => ({ id: c._id.toHexString(), name: c.name }))}
          initial={{
            id,
            title: event.title,
            sport: event.sport,
            league: event.league ?? "",
            teamAName: event.teamA?.name ?? "",
            teamALogo: event.teamA?.logoUrl ?? "",
            teamBName: event.teamB?.name ?? "",
            teamBLogo: event.teamB?.logoUrl ?? "",
            startsAt: toLocalInput(event.startsAt),
            endsAt: toLocalInput(event.endsAt),
            forcedStatus: event.forcedStatus ?? "",
            channelIds: event.channelIds.map((c) => c.toHexString()),
            isFeatured: event.isFeatured,
          }}
        />
      </div>
    </div>
  );
}
