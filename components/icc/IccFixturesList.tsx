"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { EventLite } from "@/lib/data/events";
import { deriveEventStatus, type EventStatus, cn } from "@/lib/utils";
import { LiveBadge, Badge } from "@/components/ui/Badge";

type Gender = "all" | "men" | "women";
type Format = "all" | "T20I" | "ODI" | "Test";
type StatusFilter = "all" | "live" | "upcoming" | "ended";

const GENDER_TABS: { key: Gender; label: string }[] = [
  { key: "all", label: "All" },
  { key: "men", label: "Men's" },
  { key: "women", label: "Women's" },
];

const FORMAT_CHIPS: { key: Format; label: string }[] = [
  { key: "all", label: "All Formats" },
  { key: "T20I", label: "T20I" },
  { key: "ODI", label: "ODI" },
  { key: "Test", label: "Test" },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
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

/** Derive cricket format from the league name (e.g. "ICC Men's T20I World Cup 2026" → "T20I"). */
function formatFromLeague(league: string | undefined): string {
  if (!league) return "";
  const upper = league.toUpperCase();
  if (upper.includes("TEST")) return "Test";
  if (upper.includes("ODI")) return "ODI";
  if (upper.includes("T20")) return "T20I";
  return "";
}

/** Derive gender from the league name. */
function genderFromLeague(league: string | undefined): Gender {
  if (!league) return "men";
  const lower = league.toLowerCase();
  if (lower.includes("women")) return "women";
  return "men";
}

function TeamCard({
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

function FormatBadge({ format }: { format: string }) {
  if (!format) return null;
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
        format === "T20I" && "bg-purple-500/15 text-purple-400",
        format === "ODI" && "bg-blue-500/15 text-blue-400",
        format === "Test" && "bg-amber-500/15 text-amber-400",
      )}
    >
      {format}
    </span>
  );
}

function IccFixtureCard({ event, now }: { event: EventLite; now: number }) {
  const status = deriveEventStatus(event, now);
  const href = `/event/${event.slug}`;
  const watchLabel = status === "ended" ? "Watch" : "Watch Live";
  const format = formatFromLeague(event.league);

  return (
    <div
      className={cn(
        "group animate-fade-up rounded-2xl border border-white/5 bg-gradient-to-b from-surface-2 to-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/20 card-glow",
        status === "live" && "border-live/25",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <FormatBadge format={format} />
          <span className="truncate text-[10px] font-bold uppercase tracking-widest text-ink-faint">
            <time dateTime={event.startsAt} suppressHydrationWarning>
              {timeLabel(event.startsAt)}
            </time>
          </span>
        </div>
        <span suppressHydrationWarning>
          <StatusPill status={status} startsAt={event.startsAt} />
        </span>
      </div>

      {event.league && (
        <p className="mt-1.5 truncate text-[10px] text-ink-faint" title={event.league}>
          {event.league}
        </p>
      )}

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamCard team={event.teamA} />
        <span className="px-1 text-[10px] font-black tracking-wider text-ink-faint/60">
          VS
        </span>
        <TeamCard team={event.teamB} align="right" />
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

export function IccFixturesList({ events }: { events: EventLite[] }) {
  const [now, setNow] = useState(() => Date.now());
  const [gender, setGender] = useState<Gender>("all");
  const [format, setFormat] = useState<Format>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (gender !== "all" && genderFromLeague(e.league) !== gender) return false;
      if (format !== "all" && !formatFromLeague(e.league).toLowerCase().startsWith(format.toLowerCase()))
        return false;
      if (statusFilter !== "all" && deriveEventStatus(e, now) !== statusFilter) return false;
      return true;
    });
  }, [events, gender, format, statusFilter, now]);

  const counts = useMemo(() => {
    const base = events.filter((e) => {
      if (gender !== "all" && genderFromLeague(e.league) !== gender) return false;
      if (format !== "all" && !formatFromLeague(e.league).toLowerCase().startsWith(format.toLowerCase()))
        return false;
      return true;
    });
    const c = { all: base.length, live: 0, upcoming: 0, ended: 0 };
    for (const e of base) c[deriveEventStatus(e, now)] += 1;
    return c;
  }, [events, gender, format, now]);

  const groups = useMemo(() => {
    const map = new Map<string, { date: Date; items: EventLite[] }>();
    for (const e of filtered) {
      const d = new Date(e.startsAt);
      const key = dayKey(d);
      const g = map.get(key);
      if (g) g.items.push(e);
      else map.set(key, { date: d, items: [e] });
    }
    return [...map.values()];
  }, [filtered]);

  const nowDate = new Date(now);

  return (
    <div className="flex flex-col gap-6">
      {/* Gender tabs */}
      <div className="flex flex-wrap gap-2 border-b border-edge pb-4">
        {GENDER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setGender(t.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              gender === t.key
                ? "border-brand bg-brand/15 text-brand"
                : "border-edge bg-surface text-ink-muted hover:border-brand/50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Format + status filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FORMAT_CHIPS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFormat(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              format === f.key
                ? "border-brand bg-brand/15 text-brand"
                : "border-edge bg-surface text-ink-muted hover:border-brand/50",
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-edge" />
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            suppressHydrationWarning
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === s.key
                ? "border-brand bg-brand/15 text-brand"
                : "border-edge bg-surface text-ink-muted hover:border-brand/50",
            )}
          >
            {s.label}
            {s.key !== "all" && (
              <span className="ml-1 text-ink-faint">({counts[s.key]})</span>
            )}
            {s.key === "all" && (
              <span className="ml-1 text-ink-faint">({counts.all})</span>
            )}
          </button>
        ))}
      </div>

      {/* Fixture groups */}
      {groups.length === 0 ? (
        <p className="py-20 text-center text-sm text-ink-faint">
          No matches found for the selected filters.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <section key={dayKey(g.date)}>
              <div className="sticky top-16 z-10 -mx-1 mb-3 flex items-center gap-3 bg-bg/85 px-1 py-1.5 backdrop-blur-sm">
                <h2
                  className="text-base font-black tracking-tight"
                  suppressHydrationWarning
                >
                  {dayLabel(g.date, nowDate)}
                </h2>
                <span className="h-px flex-1 bg-white/5" />
                <span
                  className="text-[11px] font-semibold text-ink-faint"
                  suppressHydrationWarning
                >
                  {g.date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((e) => (
                  <IccFixtureCard key={e.id} event={e} now={now} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
