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
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={64}
          height={64}
          className="size-16 rounded-full bg-surface-2 object-cover"
        />
      ) : (
        <span className="grid size-16 place-items-center rounded-full bg-surface-2 text-lg font-bold">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <p className="text-center font-semibold">{team.name}</p>
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
      <header className="rounded-xl border border-edge bg-surface p-5">
        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wide text-ink-faint">
          <span>{event.league ?? event.sport}</span>
          {status === "live" && <LiveBadge />}
          {status === "upcoming" && <Badge variant="brand">Upcoming</Badge>}
          {status === "ended" && <Badge>Ended</Badge>}
        </div>

        {event.teamA && event.teamB ? (
          <div className="mt-4 flex items-center justify-center gap-8">
            <Team team={event.teamA} />
            <span className="text-xl font-bold text-ink-faint">VS</span>
            <Team team={event.teamB} />
          </div>
        ) : (
          <h1 className="mt-3 text-center text-xl font-bold">{event.title}</h1>
        )}

        <p className="mt-3 text-center text-sm text-ink-muted">
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
      </header>

      {channels.length > 0 ? (
        <div>
          {channels.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {channels.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    i === selected
                      ? "border-brand bg-brand/15 text-brand"
                      : "border-edge bg-surface text-ink-muted hover:border-brand/50",
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
              poster={channel.logoUrl}
            />
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-edge py-12 text-center text-sm text-ink-faint">
          No broadcast channel linked to this event yet.
        </p>
      )}
    </div>
  );
}
