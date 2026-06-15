"use client";

import Image from "next/image";
import { useState } from "react";
import type { EventLite } from "@/lib/data/events";
import type { ChannelLite } from "@/lib/data/channels";
import { cn } from "@/lib/utils";
import { LiveBadge, Badge } from "@/components/ui/Badge";
import { LivePlayer } from "@/components/player/LivePlayer";
import { useEventStatus } from "./EventCard";

function Team({ team }: { team?: { name: string; logoUrl?: string } }) {
  if (!team) return null;
  return (
    <div className="flex flex-col items-center gap-2">
      {team.logoUrl ? (
        <div className="size-14 overflow-hidden rounded-full ring-2 ring-white/10">
          <Image
            src={team.logoUrl}
            alt={team.name}
            width={56}
            height={56}
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="grid size-14 place-items-center rounded-full bg-surface-3 ring-2 ring-white/10">
          <span className="text-lg font-black text-ink-muted">
            {team.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <p className="max-w-20 text-center text-xs font-bold leading-snug">
        {team.name}
      </p>
    </div>
  );
}

export function EventWatch({
  event,
  channels,
}: {
  event: EventLite;
  channels: ChannelLite[];
}) {
  const { status } = useEventStatus(event);
  const [selected, setSelected] = useState(0);
  const channel = channels[selected];
  const start = new Date(event.startsAt);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Left column: player */}
      <div className="flex flex-col gap-4 min-w-0">
        {channels.length > 0 ? (
          <>
            {channel && (
              <LivePlayer
                key={channel.id}
                channelId={channel.id}
                channelName={channel.name}
                sourceLabels={
                  channel.sourceLabels.length > 0
                    ? channel.sourceLabels
                    : ["Server 1"]
                }
                sourceTypes={
                  channel.sourceTypes.length > 0
                    ? channel.sourceTypes
                    : ["hls"]
                }
                poster={channel.logoUrl}
              />
            )}
            {channels.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-faint">Watch on:</span>
                {channels.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(i)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                      i === selected
                        ? "border-brand/40 bg-brand/15 text-brand shadow-sm shadow-brand/10"
                        : "border-white/5 bg-surface text-ink-muted hover:border-white/10 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-white/8 bg-surface">
            <p className="text-sm font-medium text-ink-faint">
              No broadcast channel linked to this event yet.
            </p>
          </div>
        )}
      </div>

      {/* Right column: match info */}
      <aside className="flex flex-col gap-4">
        <div className="bg-match-header relative overflow-hidden rounded-xl border border-white/5">
          <div
            className={cn(
              "h-0.5 w-full",
              status === "live"
                ? "bg-gradient-to-r from-transparent via-live to-transparent"
                : status === "upcoming"
                  ? "bg-gradient-to-r from-transparent via-brand to-transparent"
                  : "bg-white/5",
            )}
          />

          <div className="px-4 py-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                {event.league ?? event.sport}
              </span>
              {status === "live" && <LiveBadge />}
              {status === "upcoming" && <Badge variant="brand">Upcoming</Badge>}
              {status === "ended" && <Badge>Ended</Badge>}
            </div>

            {event.teamA && event.teamB ? (
              <>
                <h1 className="sr-only">
                  {event.teamA.name} vs {event.teamB.name}{event.league ? ` — ${event.league}` : ""} Live Stream
                </h1>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <Team team={event.teamA} />
                  <span className="text-2xl font-black tracking-tight text-ink-faint/40" aria-hidden="true">
                    VS
                  </span>
                  <Team team={event.teamB} />
                </div>
              </>
            ) : (
              <h1 className="mt-4 text-center text-xl font-black tracking-tight">
                {event.title}
              </h1>
            )}

            <p className="mt-4 text-center text-xs font-medium text-ink-muted">
              <time dateTime={event.startsAt} suppressHydrationWarning>
                {start.toLocaleString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
