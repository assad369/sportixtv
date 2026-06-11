"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { EventLite } from "@/lib/data/events";
import { deriveEventStatus, type EventStatus } from "@/lib/utils";
import { LiveBadge, Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

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

function TeamBlock({ team }: { team?: { name: string; logoUrl?: string } }) {
  if (!team) return null;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      {team.logoUrl ? (
        <div className="size-11 overflow-hidden rounded-full ring-2 ring-white/8">
          <Image
            src={team.logoUrl}
            alt=""
            width={44}
            height={44}
            className="size-full object-cover"
          />
        </div>
      ) : (
        <span className="grid size-11 place-items-center rounded-full bg-surface-3 text-sm font-black text-ink-muted ring-2 ring-white/8">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <p className="w-full truncate text-center text-xs font-semibold">{team.name}</p>
    </div>
  );
}

export function EventCard({ event }: { event: EventLite }) {
  const { status, now } = useEventStatus(event);
  const start = new Date(event.startsAt);

  return (
    <Link
      href={`/event/${event.slug}`}
      className="card-glow group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-surface-2 to-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand/20 sm:w-72"
    >
      {/* Status accent line */}
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

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-bold uppercase tracking-widest text-ink-faint">
            {event.league ?? event.sport}
          </span>
          {status === "live" && <LiveBadge />}
          {status === "upcoming" && (
            <Badge variant="brand" className="normal-case shrink-0">
              <span suppressHydrationWarning>
                {countdownText(event.startsAt, now)}
              </span>
            </Badge>
          )}
          {status === "ended" && <Badge>Ended</Badge>}
        </div>

        {event.teamA && event.teamB ? (
          <div className="mt-4 flex items-center gap-2">
            <TeamBlock team={event.teamA} />
            <div className="flex shrink-0 flex-col items-center">
              <span className="text-xs font-black tracking-wider text-ink-faint/60">VS</span>
            </div>
            <TeamBlock team={event.teamB} />
          </div>
        ) : (
          <p className="mt-3 line-clamp-2 text-sm font-bold leading-snug">{event.title}</p>
        )}

        <time
          dateTime={event.startsAt}
          suppressHydrationWarning
          className="mt-3 block text-center text-[10px] font-medium text-ink-faint"
        >
          {start.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </Link>
  );
}
