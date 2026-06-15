import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { channels } from "@/lib/db/collections";
import { getLeagueChannelMap } from "@/lib/data/fixtures";
import { LeagueChannelMapForm } from "@/components/admin/LeagueChannelMapForm";

export default async function EditMappingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const map = await getLeagueChannelMap(id);
  if (!map) notFound();

  const col = await channels();
  const chs = await col
    .find({}, { projection: { name: 1 } })
    .sort({ name: 1 })
    .toArray();

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit Mapping</h1>
      <div className="mt-6">
        <LeagueChannelMapForm
          channels={chs.map((c) => ({ id: c._id.toHexString(), name: c.name }))}
          initial={{
            id: map.id,
            sport: map.match.sport ?? "",
            league: map.match.league ?? "",
            providerLeagueId: map.match.providerLeagueId ?? "",
            source: map.match.source ?? "",
            channelIds: map.channelIds,
            priority: String(map.priority),
            enabled: map.enabled,
          }}
        />
      </div>
    </div>
  );
}
