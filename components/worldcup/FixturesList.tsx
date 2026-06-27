"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { EventLite } from "@/lib/data/events";
import { deriveEventStatus, type EventStatus, cn } from "@/lib/utils";
import { LiveBadge, Badge } from "@/components/ui/Badge";

type Filter = "all" | "live" | "upcoming" | "ended";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ended", label: "Finished" },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(date: Date, now: Date): string {
  const diff = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function TeamRow({
  team,
  align = "left",
}: {
  team?: { name: string; logoUrl?: string };
  align?: "left" | "right";
}) {
  const name = team?.name ?? "TBD";
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2.5",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      {team?.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt={`${name} flag`}
          width={32}
          height={24}
          className="h-6 w-8 shrink-0 rounded-sm object-cover ring-1 ring-white/10"
        />
      ) : (
        <span className="grid h-6 w-8 shrink-0 place-items-center rounded-sm bg-surface-3 text-[9px] font-black text-ink-faint ring-1 ring-white/10">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="truncate text-sm font-semibold">{name}</span>
    </div>
  );
}

function StatusPill({ status, startsAt }: { status: EventStatus; startsAt: string }) {
  if (status === "live") return <LiveBadge />;
  if (status === "ended") return <Badge>Finished</Badge>;
  return (
    <Badge variant="brand" className="normal-case">
      <time dateTime={startsAt} suppressHydrationWarning>
        {timeLabel(startsAt)}
      </time>
    </Badge>
  );
}

function FixtureCard({ event, now }: { event: EventLite; now: number }) {
  const status = deriveEventStatus(event, now);
  const href = `/event/${event.slug}`;
  const watchLabel = status === "ended" ? "Watch" : "Watch Live";

  return (
    <div
      className={cn(
        "group animate-fade-up rounded-2xl border border-white/5 bg-gradient-to-b from-surface-2 to-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/20 card-glow",
        status === "live" && "border-live/25",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-bold uppercase tracking-widest text-ink-faint">
          <time dateTime={event.startsAt} suppressHydrationWarning>
            {timeLabel(event.startsAt)}
          </time>
        </span>
        <span suppressHydrationWarning>
          <StatusPill status={status} startsAt={event.startsAt} />
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamRow team={event.teamA} />
        <span className="px-1 text-[10px] font-black tracking-wider text-ink-faint/60">
          VS
        </span>
        <TeamRow team={event.teamB} align="right" />
      </div>

      {event.venue && (
        <p className="mt-3 truncate text-[11px] text-ink-muted" title={event.venue}>
          <span aria-hidden>📍 </span>
          {event.venue}
        </p>
      )}

      <Link
        href={href}
        aria-label={`${watchLabel}: ${event.title}`}
        className={cn(
          "mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors",
          status === "live"
            ? "bg-live/15 text-live ring-1 ring-live/30 hover:bg-live/25"
            : "bg-brand/15 text-brand ring-1 ring-brand/25 hover:bg-brand/25",
        )}
      >
        {status === "live" && (
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-live" />
          </span>
        )}
        {watchLabel}
      </Link>
    </div>
  );
}

export function FixturesList({ events }: { events: EventLite[] }) {
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const counts = useMemo(() => {
    const c = { all: events.length, live: 0, upcoming: 0, ended: 0 };
    for (const e of events) c[deriveEventStatus(e, now)] += 1;
    return c;
  }, [events, now]);

  // Filter, then group by local calendar day (events arrive sorted by kickoff).
  const groups = useMemo(() => {
    const visible =
      filter === "all"
        ? events
        : events.filter((e) => deriveEventStatus(e, now) === filter);
    const map = new Map<string, { date: Date; items: EventLite[] }>();
    for (const e of visible) {
      const d = new Date(e.startsAt);
      const key = dayKey(d);
      const g = map.get(key);
      if (g) g.items.push(e);
      else map.set(key, { date: d, items: [e] });
    }
    return [...map.values()];
  }, [events, filter, now]);

  const nowDate = new Date(now);

  return (
    <div>
      <div className="flex flex-wrap gap-2" suppressHydrationWarning>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-brand bg-brand/15 text-brand"
                : "border-edge bg-surface text-ink-muted hover:border-brand/50",
            )}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="py-20 text-center text-sm text-ink-faint">
          No {filter} matches.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {groups.map((g) => (
            <section key={dayKey(g.date)}>
              <div className="sticky top-16 z-10 -mx-1 mb-3 flex items-center gap-3 bg-bg/85 px-1 py-1.5 backdrop-blur-sm">
                <h2 className="text-base font-black tracking-tight" suppressHydrationWarning>
                  {dayLabel(g.date, nowDate)}
                </h2>
                <span className="h-px flex-1 bg-white/5" />
                <span className="text-[11px] font-semibold text-ink-faint" suppressHydrationWarning>
                  {g.date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((e) => (
                  <FixtureCard key={e.id} event={e} now={now} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
