import { requireSession } from "@/lib/auth/session";
import { channels } from "@/lib/db/collections";
import { LeagueChannelMapForm } from "@/components/admin/LeagueChannelMapForm";

export default async function NewMappingPage() {
  await requireSession();
  const col = await channels();
  const chs = await col
    .find({}, { projection: { name: 1 } })
    .sort({ name: 1 })
    .toArray();

  return (
    <div>
      <h1 className="text-2xl font-bold">New Mapping</h1>
      <div className="mt-6">
        <LeagueChannelMapForm
          channels={chs.map((c) => ({ id: c._id.toHexString(), name: c.name }))}
          initial={{
            sport: "",
            league: "",
            providerLeagueId: "",
            source: "",
            channelIds: [],
            priority: "0",
            enabled: true,
          }}
        />
      </div>
    </div>
  );
}
