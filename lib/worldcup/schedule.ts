/**
 * FIFA World Cup 2026™ — official match schedule (Jun 11 – Jul 19, 2026).
 *
 * Static, fully-known dataset transcribed from the official FOX/Telemundo
 * schedule. The sync module (lib/worldcup/sync.ts) idempotently upserts these
 * into the `events` collection, so the site needs no external fixture provider.
 *
 * Times: the schedule lists PT/ET; we store the ET wall-clock with an explicit
 * `-04:00` offset (EDT — constant across the whole tournament). `new Date(kickoffEt)`
 * therefore yields the correct UTC instant, including games that roll past
 * midnight ET (e.g. "Jun 13/14 12:00AM ET" → 2026-06-14T00:00:00-04:00).
 */

export interface WorldCupFixture {
  /** Stable id (idempotency key suffix). Never reorder existing entries. */
  id: string;
  stage: string;
  /** Country name for group fixtures; null when the team is still TBD. */
  home: string | null;
  away: string | null;
  /** Bracket/round label for knockout fixtures with unknown teams. */
  placeholder?: string;
  /** ET wall-clock kickoff with -04:00 offset; parses to the correct UTC instant. */
  kickoffEt: string;
  venue: string;
  network: string;
}

/** `date` is the ET calendar date; `time` is 24h ET ("15:00"). */
function et(date: string, time: string): string {
  return `${date}T${time}:00-04:00`;
}

type GroupRow = [
  date: string,
  time: string,
  home: string,
  away: string,
  venue: string,
  net: string,
];

// ── Group stage ────────────────────────────────────────────────────────────
const GROUP_ROWS: GroupRow[] = [
  ["2026-06-11", "15:00", "Mexico", "South Africa", "Estadio Azteca; Mexico City, MEX", "FOX"],
  ["2026-06-11", "22:00", "South Korea", "Czechia", "Estadio Akron; Guadalajara, MEX", "FS1"],
  ["2026-06-12", "15:00", "Canada", "Bosnia and Herzegovina", "BMO Field; Toronto, CAN", "FOX"],
  ["2026-06-12", "21:00", "United States", "Paraguay", "SoFi Stadium; Inglewood, CA", "FOX"],
  ["2026-06-13", "15:00", "Qatar", "Switzerland", "Levi's Stadium; Santa Clara, CA", "FOX"],
  ["2026-06-13", "18:00", "Brazil", "Morocco", "MetLife Stadium; East Rutherford, NJ", "FS1"],
  ["2026-06-13", "21:00", "Haiti", "Scotland", "Gillette Stadium; Foxborough, MA", "FS1"],
  ["2026-06-14", "00:00", "Australia", "Türkiye", "BC Place; Vancouver, CAN", "FS1"],
  ["2026-06-14", "13:00", "Germany", "Curacao", "NRG Stadium; Houston, TX", "FOX"],
  ["2026-06-14", "16:00", "Netherlands", "Japan", "AT&T Stadium; Arlington, TX", "FOX"],
  ["2026-06-14", "19:00", "Ivory Coast", "Ecuador", "Lincoln Financial Field; Philadelphia, PA", "FS1"],
  ["2026-06-14", "22:00", "Sweden", "Tunisia", "Estadio BBVA Bancomer; Monterrey, MEX", "FS1"],
  ["2026-06-15", "12:00", "Spain", "Cape Verde", "Mercedes-Benz Stadium; Atlanta, GA", "FOX"],
  ["2026-06-15", "15:00", "Belgium", "Egypt", "Lumen Field; Seattle, WA", "FOX"],
  ["2026-06-15", "18:00", "Saudi Arabia", "Uruguay", "Hard Rock Stadium; Miami, FL", "FS1"],
  ["2026-06-15", "21:00", "Iran", "New Zealand", "SoFi Stadium; Inglewood, CA", "FS1"],
  ["2026-06-16", "15:00", "France", "Senegal", "MetLife Stadium; East Rutherford, NJ", "FOX"],
  ["2026-06-16", "18:00", "Iraq", "Norway", "Gillette Stadium; Foxborough, MA", "FOX"],
  ["2026-06-16", "21:00", "Argentina", "Algeria", "Arrowhead Stadium; Kansas City, MO", "FOX"],
  ["2026-06-17", "00:00", "Austria", "Jordan", "Levi's Stadium; Santa Clara, CA", "FS1"],
  ["2026-06-17", "13:00", "Portugal", "Congo DR", "NRG Stadium; Houston, TX", "FOX"],
  ["2026-06-17", "16:00", "England", "Croatia", "AT&T Stadium; Arlington, TX", "FOX"],
  ["2026-06-17", "19:00", "Ghana", "Panama", "BMO Field; Toronto, CAN", "FS1"],
  ["2026-06-17", "22:00", "Uzbekistan", "Colombia", "Estadio Azteca; Mexico City, MEX", "FS1"],
  ["2026-06-18", "12:00", "Czechia", "South Africa", "Mercedes-Benz Stadium; Atlanta, GA", "FOX"],
  ["2026-06-18", "15:00", "Switzerland", "Bosnia and Herzegovina", "SoFi Stadium; Inglewood, CA", "FOX"],
  ["2026-06-18", "18:00", "Canada", "Qatar", "BC Place; Vancouver, CAN", "FS1"],
  ["2026-06-18", "21:00", "Mexico", "South Korea", "Estadio Akron; Guadalajara, MEX", "FOX"],
  ["2026-06-19", "15:00", "United States", "Australia", "Lumen Field; Seattle, WA", "FOX"],
  ["2026-06-19", "18:00", "Scotland", "Morocco", "Gillette Stadium; Foxborough, MA", "FOX"],
  ["2026-06-19", "20:30", "Brazil", "Haiti", "Lincoln Financial Field; Philadelphia, PA", "FOX"],
  ["2026-06-19", "23:00", "Türkiye", "Paraguay", "Levi's Stadium; Santa Clara, CA", "FS1"],
  ["2026-06-20", "13:00", "Netherlands", "Sweden", "NRG Stadium; Houston, TX", "FOX"],
  ["2026-06-20", "16:00", "Germany", "Ivory Coast", "BMO Field; Toronto, CAN", "FOX"],
  ["2026-06-20", "20:00", "Ecuador", "Curacao", "Arrowhead Stadium; Kansas City, MO", "FS1"],
  ["2026-06-21", "00:00", "Tunisia", "Japan", "Estadio BBVA Bancomer; Monterrey, MEX", "FS1"],
  ["2026-06-21", "12:00", "Spain", "Saudi Arabia", "Mercedes-Benz Stadium; Atlanta, GA", "FOX"],
  ["2026-06-21", "15:00", "Belgium", "Iran", "SoFi Stadium; Inglewood, CA", "FS1"],
  ["2026-06-21", "18:00", "Uruguay", "Cape Verde", "Hard Rock Stadium; Miami, FL", "FS1"],
  ["2026-06-21", "21:00", "New Zealand", "Egypt", "BC Place; Vancouver, CAN", "FS1"],
  ["2026-06-22", "13:00", "Argentina", "Austria", "AT&T Stadium; Arlington, TX", "FOX"],
  ["2026-06-22", "17:00", "France", "Iraq", "Lincoln Financial Field; Philadelphia, PA", "FOX"],
  ["2026-06-22", "20:00", "Norway", "Senegal", "MetLife Stadium; East Rutherford, NJ", "FOX"],
  ["2026-06-22", "23:00", "Jordan", "Algeria", "Levi's Stadium; Santa Clara, CA", "FS1"],
  ["2026-06-23", "13:00", "Portugal", "Uzbekistan", "NRG Stadium; Houston, TX", "FOX"],
  ["2026-06-23", "16:00", "England", "Ghana", "Gillette Stadium; Foxborough, MA", "FOX"],
  ["2026-06-23", "19:00", "Panama", "Croatia", "BMO Field; Toronto, CAN", "FOX"],
  ["2026-06-23", "22:00", "Colombia", "Congo DR", "Estadio Akron; Guadalajara, MEX", "FS1"],
  ["2026-06-24", "15:00", "Switzerland", "Canada", "BC Place; Vancouver, CAN", "FOX"],
  ["2026-06-24", "15:00", "Bosnia and Herzegovina", "Qatar", "Lumen Field; Seattle, WA", "FS1"],
  ["2026-06-24", "18:00", "Scotland", "Brazil", "Hard Rock Stadium; Miami, FL", "FOX"],
  ["2026-06-24", "18:00", "Morocco", "Haiti", "Mercedes-Benz Stadium; Atlanta, GA", "FS1"],
  ["2026-06-24", "21:00", "Czechia", "Mexico", "Estadio Azteca; Mexico City, MEX", "FOX"],
  ["2026-06-24", "21:00", "South Africa", "South Korea", "Estadio BBVA Bancomer; Monterrey, MEX", "FS1"],
  ["2026-06-25", "16:00", "Ecuador", "Germany", "MetLife Stadium; East Rutherford, NJ", "FOX"],
  ["2026-06-25", "16:00", "Curacao", "Ivory Coast", "Lincoln Financial Field; Philadelphia, PA", "FS1"],
  ["2026-06-25", "19:00", "Tunisia", "Netherlands", "Arrowhead Stadium; Kansas City, MO", "FOX"],
  ["2026-06-25", "19:00", "Japan", "Sweden", "AT&T Stadium; Arlington, TX", "FS1"],
  ["2026-06-25", "22:00", "Türkiye", "United States", "SoFi Stadium; Inglewood, CA", "FOX"],
  ["2026-06-25", "22:00", "Paraguay", "Australia", "Levi's Stadium; Santa Clara, CA", "FS1"],
  ["2026-06-26", "15:00", "Norway", "France", "Gillette Stadium; Foxborough, MA", "FOX"],
  ["2026-06-26", "15:00", "Senegal", "Iraq", "BMO Field; Toronto, CAN", "FS1"],
  ["2026-06-26", "20:00", "Uruguay", "Spain", "Estadio Akron; Guadalajara, MEX", "FOX"],
  ["2026-06-26", "20:00", "Cape Verde", "Saudi Arabia", "NRG Stadium; Houston, TX", "FS1"],
  ["2026-06-26", "23:00", "New Zealand", "Belgium", "BC Place; Vancouver, CAN", "FOX"],
  ["2026-06-26", "23:00", "Egypt", "Iran", "Lumen Field; Seattle, WA", "FS1"],
  ["2026-06-27", "17:00", "Panama", "England", "MetLife Stadium; East Rutherford, NJ", "FOX"],
  ["2026-06-27", "17:00", "Croatia", "Ghana", "Lincoln Financial Field; Philadelphia, PA", "FS1"],
  ["2026-06-27", "19:30", "Colombia", "Portugal", "Hard Rock Stadium; Miami, FL", "FOX"],
  ["2026-06-27", "19:30", "Congo DR", "Uzbekistan", "Mercedes-Benz Stadium; Atlanta, GA", "FS1"],
  ["2026-06-27", "23:00", "Jordan", "Argentina", "AT&T Stadium; Arlington, TX", "FOX"],
  ["2026-06-27", "23:00", "Algeria", "Austria", "Arrowhead Stadium; Kansas City, MO", "FS1"],
];

type KnockoutRow = [
  date: string,
  time: string,
  placeholder: string,
  venue: string,
  net: string,
];

function knockoutRows(
  stage: string,
  rows: KnockoutRow[],
  startSeq: number,
): WorldCupFixture[] {
  return rows.map(([date, time, placeholder, venue, net], i) => ({
    id: `wc2026-${String(startSeq + i).padStart(3, "0")}`,
    stage,
    home: null,
    away: null,
    placeholder,
    kickoffEt: et(date, time),
    venue,
    network: net,
  }));
}

// ── Knockout stages ─────────────────────────────────────────────────────────
const ROUND_OF_32: KnockoutRow[] = [
  ["2026-06-28", "15:00", "2A vs 2B", "SoFi Stadium; Inglewood, CA", "FOX"],
  ["2026-06-29", "13:00", "1C vs 2F", "NRG Stadium; Houston, TX", "FOX"],
  ["2026-06-29", "16:30", "1E vs 3ABCDF", "Gillette Stadium; Foxborough, MA", "FOX"],
  ["2026-06-29", "21:00", "1F vs 2C", "Estadio BBVA Bancomer; Monterrey, MEX", "FOX"],
  ["2026-06-30", "13:00", "2E vs 2I", "AT&T Stadium; Arlington, TX", "FOX"],
  ["2026-06-30", "17:00", "1I vs 3CDFGH", "MetLife Stadium; East Rutherford, NJ", "FOX"],
  ["2026-06-30", "21:00", "1A vs 3CEFHI", "Estadio Azteca; Mexico City, MEX", "FOX"],
  ["2026-07-01", "12:00", "1L vs 3EHIJK", "Mercedes-Benz Stadium; Atlanta, GA", "FOX"],
  ["2026-07-01", "16:00", "1G vs 3AEHIJ", "Lumen Field; Seattle, WA", "FS1"],
  ["2026-07-01", "20:00", "1D vs 3BEFIJ", "Levi's Stadium; Santa Clara, CA", "FOX"],
  ["2026-07-02", "15:00", "1H vs 2J", "SoFi Stadium; Inglewood, CA", "FOX"],
  ["2026-07-02", "19:00", "2K vs 2L", "BMO Field; Toronto, CAN", "FOX"],
  ["2026-07-02", "23:00", "1B vs 3EFGIJ", "BC Place; Vancouver, CAN", "FS1"],
  ["2026-07-03", "14:00", "2D vs 2G", "AT&T Stadium; Arlington, TX", "FOX"],
  ["2026-07-03", "18:00", "1J vs 2H", "Hard Rock Stadium; Miami, FL", "FOX"],
  ["2026-07-03", "21:30", "1K vs 3DEIJL", "Arrowhead Stadium; Kansas City, MO", "FOX"],
];

const ROUND_OF_16: KnockoutRow[] = [
  ["2026-07-04", "13:00", "Match 1", "NRG Stadium; Houston, TX", "FOX"],
  ["2026-07-04", "17:00", "Match 2", "Lincoln Financial Field; Philadelphia, PA", "FOX"],
  ["2026-07-05", "16:00", "Match 3", "MetLife Stadium; East Rutherford, NJ", "FOX"],
  ["2026-07-05", "20:00", "Match 4", "Estadio Azteca; Mexico City, MEX", "FOX"],
  ["2026-07-06", "15:00", "Match 5", "AT&T Stadium; Arlington, TX", "FOX"],
  ["2026-07-06", "20:00", "Match 6", "Lumen Field; Seattle, WA", "FOX"],
  ["2026-07-07", "12:00", "Match 7", "Mercedes-Benz Stadium; Atlanta, GA", "FOX"],
  ["2026-07-07", "16:00", "Match 8", "BC Place; Vancouver, CAN", "FOX"],
];

const QUARTERFINALS: KnockoutRow[] = [
  ["2026-07-09", "16:00", "Match 1", "Gillette Stadium; Foxborough, MA", "FOX"],
  ["2026-07-10", "15:00", "Match 2", "SoFi Stadium; Inglewood, CA", "FOX"],
  ["2026-07-11", "17:00", "Match 3", "Hard Rock Stadium; Miami, FL", "FOX"],
  ["2026-07-11", "21:00", "Match 4", "Arrowhead Stadium; Kansas City, MO", "FOX"],
];

const SEMIFINALS: KnockoutRow[] = [
  ["2026-07-14", "15:00", "Match 1", "AT&T Stadium; Arlington, TX", "FOX"],
  ["2026-07-15", "15:00", "Match 2", "Mercedes-Benz Stadium; Atlanta, GA", "FOX"],
];

const THIRD_PLACE: KnockoutRow[] = [
  ["2026-07-18", "17:00", "", "Hard Rock Stadium; Miami, FL", "FOX"],
];

const FINAL: KnockoutRow[] = [
  ["2026-07-19", "15:00", "", "MetLife Stadium; East Rutherford, NJ", "FOX"],
];

const GROUP_FIXTURES: WorldCupFixture[] = GROUP_ROWS.map(
  ([date, time, home, away, venue, net], i) => ({
    id: `wc2026-${String(i + 1).padStart(3, "0")}`,
    stage: "Group Stage",
    home,
    away,
    kickoffEt: et(date, time),
    venue,
    network: net,
  }),
);

let seq = GROUP_FIXTURES.length + 1;
function append(stage: string, rows: KnockoutRow[]): WorldCupFixture[] {
  const out = knockoutRows(stage, rows, seq);
  seq += rows.length;
  return out;
}

export const WORLD_CUP_FIXTURES: WorldCupFixture[] = [
  ...GROUP_FIXTURES,
  ...append("Round of 32", ROUND_OF_32),
  ...append("Round of 16", ROUND_OF_16),
  ...append("Quarter-finals", QUARTERFINALS),
  ...append("Semi-finals", SEMIFINALS),
  ...append("Third-place Play-off", THIRD_PLACE),
  ...append("Final", FINAL),
];

/** Human-readable match title used for the event record + slug. */
export function fixtureTitle(f: WorldCupFixture): string {
  if (f.home && f.away) return `${f.home} vs ${f.away}`;
  return f.placeholder ? `${f.stage}: ${f.placeholder}` : f.stage;
}
