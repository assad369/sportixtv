/**
 * Country → flag image URL for World Cup fixtures. We reuse the existing
 * team-logo rendering (EventCard / fixture cards expect a `logoUrl`), so each
 * national team just gets a flag CDN URL. flagcdn.com serves crisp PNGs and is
 * already allowed by next.config images.remotePatterns ("**").
 */

/** Country name (as it appears in the schedule) → ISO 3166-1 alpha-2 (or region). */
const COUNTRY_CODE: Record<string, string> = {
  mexico: "mx",
  "south africa": "za",
  "south korea": "kr",
  czechia: "cz",
  canada: "ca",
  "bosnia and herzegovina": "ba",
  "united states": "us",
  paraguay: "py",
  qatar: "qa",
  switzerland: "ch",
  brazil: "br",
  morocco: "ma",
  haiti: "ht",
  scotland: "gb-sct",
  australia: "au",
  "türkiye": "tr",
  turkiye: "tr",
  germany: "de",
  curacao: "cw",
  netherlands: "nl",
  japan: "jp",
  "ivory coast": "ci",
  ecuador: "ec",
  sweden: "se",
  tunisia: "tn",
  spain: "es",
  "cape verde": "cv",
  belgium: "be",
  egypt: "eg",
  "saudi arabia": "sa",
  uruguay: "uy",
  iran: "ir",
  "new zealand": "nz",
  france: "fr",
  senegal: "sn",
  iraq: "iq",
  norway: "no",
  argentina: "ar",
  algeria: "dz",
  austria: "at",
  jordan: "jo",
  portugal: "pt",
  "congo dr": "cd",
  england: "gb-eng",
  croatia: "hr",
  ghana: "gh",
  panama: "pa",
  uzbekistan: "uz",
  colombia: "co",
};

/** Returns a flag image URL for a country, or undefined for unknown/TBD teams. */
export function flagUrl(country: string | null | undefined): string | undefined {
  if (!country) return undefined;
  const code = COUNTRY_CODE[country.trim().toLowerCase()];
  return code ? `https://flagcdn.com/w320/${code}.png` : undefined;
}
