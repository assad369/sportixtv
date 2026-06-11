"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { EventLite } from "@/lib/data/events";
import { deriveEventStatus, type EventStatus } from "@/lib/utils";
import { LiveBadge, Badge } from "@/components/ui/Badge";

function countdownText(startsAt: string, now: number): string {
  const diff = new Date(startsAt).getTime() - now;
  if (diff <= 0) return "Starting…";
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${m}m`;
  return `in ${m}m`;
}

export function useEventStatus(event: EventLite): {
  status: EventStatus;
  now: number;
} {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return { status: deriveEventStatus(event, now), now };
}

function TeamBlock({
  team,
}: {
  team?: { name: string; logoUrl?: string };
}) {
  if (!team) return null;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-full bg-surface-2 object-cover"
        />
      ) : (
        <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-sm font-bold">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <p className="w-full truncate text-center text-xs font-medium">
        {team.name}
      </p>
    </div>
  );
}

export function EventCard({ event }: { event: EventLite }) {
  const { status, now } = useEventStatus(event);
  const start = new Date(event.startsAt);

  return (
    <Link
      href={`/event/${event.slug}`}
      className="group flex w-64 shrink-0 flex-col rounded-xl border border-edge bg-surface p-3 transition-all hover:border-brand/60 hover:bg-surface-2 sm:w-72"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {event.league ?? event.sport}
        </span>
        {status === "live" && <LiveBadge />}
        {status === "upcoming" && (
          <Badge variant="brand" className="normal-case">
            <span suppressHydrationWarning>
              {countdownText(event.startsAt, now)}
            </span>
          </Badge>
        )}
        {status === "ended" && <Badge>Ended</Badge>}
      </div>

      {event.teamA && event.teamB ? (
        <div className="mt-3 flex items-center gap-2">
          <TeamBlock team={event.teamA} />
          <span className="shrink-0 text-xs font-bold text-ink-faint">VS</span>
          <TeamBlock team={event.teamB} />
        </div>
      ) : (
        <p className="mt-3 line-clamp-2 text-sm font-semibold">{event.title}</p>
      )}

      <time
        dateTime={event.startsAt}
        suppressHydrationWarning
        className="mt-3 text-center text-[11px] text-ink-faint"
      >
        {start.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
    </Link>
  );
}
