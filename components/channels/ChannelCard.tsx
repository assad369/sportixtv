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
      aria-label={`Watch ${channel.name} live stream`}
      className="card-glow group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-surface-2 to-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand/20"
    >
      {/* Hover glow overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute left-2.5 top-2.5 z-10">
        <LiveBadge />
      </div>

      <div className="relative mt-2 size-20 overflow-hidden rounded-xl ring-2 ring-white/5 transition-all duration-300 group-hover:ring-brand/30 sm:size-24">
        <Image
          src={channel.logoUrl}
          alt={`${channel.name} live TV channel`}
          fill
          sizes="96px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <p className="relative mt-3 w-full truncate text-center text-sm font-bold tracking-tight">
        {channel.name}
      </p>
      <p className="relative mt-1.5 flex items-center gap-1 text-[10px] font-medium text-ink-faint">
        <EyeIcon className="size-3" />
        {formatViews(channel.viewCount)}
      </p>
    </Link>
  );
}
