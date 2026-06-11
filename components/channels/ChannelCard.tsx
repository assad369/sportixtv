import Link from "next/link";
import Image from "next/image";
import type { ChannelLite } from "@/lib/data/channels";
import { LiveBadge } from "@/components/ui/Badge";
import { EyeIcon } from "@/components/icons";
import { formatViews } from "@/lib/utils";

export function ChannelCard({ channel }: { channel: ChannelLite }) {
  return (
    <Link
      href={`/channel/${channel.slug}`}
      className="group relative flex flex-col items-center rounded-xl border border-edge bg-surface p-4 transition-all hover:border-brand/60 hover:bg-surface-2 hover:shadow-lg hover:shadow-brand/5"
    >
      <div className="absolute left-2 top-2">
        <LiveBadge />
      </div>
      <div className="relative size-20 overflow-hidden rounded-xl bg-surface-2 sm:size-24">
        <Image
          src={channel.logoUrl}
          alt={`${channel.name} logo`}
          fill
          sizes="96px"
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <p className="mt-3 w-full truncate text-center text-sm font-semibold">
        {channel.name}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-faint">
        <EyeIcon className="size-3" />
        {formatViews(channel.viewCount)} views
      </p>
    </Link>
  );
}
