import type { ChannelLite } from "@/lib/data/channels";
import { ChannelCard } from "./ChannelCard";
import { TvIcon } from "@/components/icons";

export function ChannelGrid({
  channels,
  emptyText = "No channels here yet.",
}: {
  channels: ChannelLite[];
  emptyText?: string;
}) {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/8 py-16 text-ink-faint">
        <TvIcon className="size-10 opacity-40" />
        <p className="text-sm font-medium">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {channels.map((c) => (
        <ChannelCard key={c.id} channel={c} />
      ))}
    </div>
  );
}
