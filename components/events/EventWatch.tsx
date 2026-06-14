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
    <div className="flex flex-col items-center gap-3">
      {team.logoUrl ? (
        <div className="size-20 overflow-hidden rounded-full ring-2 ring-white/10 sm:size-24">
          <Image
            src={team.logoUrl}
            alt={team.name}
            width={96}
            height={96}
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="grid size-20 place-items-center rounded-full bg-surface-3 ring-2 ring-white/10 sm:size-24">
          <span className="text-2xl font-black text-ink-muted">
            {team.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <p className="max-w-28 text-center text-sm font-bold leading-snug sm:max-w-36">
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
    <div className="flex flex-col gap-6">
      {/* Match header card */}
      <header className="bg-match-header relative overflow-hidden rounded-2xl border border-white/5">
        {/* Status line */}
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

        <div className="px-6 py-8">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-faint">
              {event.league ?? event.sport}
            </span>
            {status === "live" && <LiveBadge />}
            {status === "upcoming" && <Badge variant="brand">Upcoming</Badge>}
            {status === "ended" && <Badge>Ended</Badge>}
          </div>

          {event.teamA && event.teamB ? (
            <div className="mt-8 flex items-center justify-center gap-6 sm:gap-16">
              <Team team={event.teamA} />
              <div className="flex flex-col items-center gap-1.5 px-2">
                <span className="text-3xl font-black tracking-tight text-ink-faint/40">
                  VS
                </span>
              </div>
              <Team team={event.teamB} />
            </div>
          ) : (
            <h1 className="mt-5 text-center text-2xl font-black tracking-tight">
              {event.title}
            </h1>
          )}

          <p className="mt-5 text-center text-sm font-medium text-ink-muted">
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
      </header>

      {/* Player section */}
      {channels.length > 0 ? (
        <div className="flex flex-col gap-4">
          {channels.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-xs font-semibold text-ink-faint">
                Watch on:
              </span>
              {channels.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200",
                    i === selected
                      ? "border-brand/40 bg-brand/15 text-brand shadow-md shadow-brand/10"
                      : "border-white/5 bg-surface text-ink-muted hover:border-white/10 hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
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
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/8 py-16 text-center">
          <p className="text-sm font-medium text-ink-faint">
            No broadcast channel linked to this event yet.
          </p>
        </div>
      )}
    </div>
  );
}
