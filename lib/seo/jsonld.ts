import type { ChannelLite } from "@/lib/data/channels";
import type { EventLite } from "@/lib/data/events";
import type { SiteSettings } from "@/lib/db/schemas/settings";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function websiteJsonLd(settings: SiteSettings) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: settings.siteName,
        description: settings.seoDescription,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${url}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: settings.siteName,
        url,
        ...(settings.logoUrl ? { logo: settings.logoUrl } : {}),
        sameAs: Object.values(settings.socialLinks).filter(Boolean),
      },
    ],
  };
}

export function channelJsonLd(channel: ChannelLite, settings: SiteSettings) {
  const url = siteUrl();
  const pageUrl = `${url}/channel/${channel.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BroadcastService",
        "@id": `${pageUrl}/#broadcast`,
        name: channel.name,
        description: channel.description || `Watch ${channel.name} live`,
        url: pageUrl,
        logo: channel.logoUrl,
        provider: { "@id": `${url}/#organization` },
        ...(channel.language ? { inLanguage: channel.language } : {}),
      },
      {
        "@type": "VideoObject",
        name: `Watch ${channel.name} Live`,
        description:
          channel.description ||
          `Watch ${channel.name} live stream online in HD on ${settings.siteName}.`,
        thumbnailUrl: [channel.logoUrl],
        uploadDate: undefined,
        contentUrl: pageUrl,
        embedUrl: pageUrl,
        isLiveBroadcast: true,
        publication: {
          "@type": "BroadcastEvent",
          isLiveBroadcast: true,
          videoFormat: "HD",
        },
      },
    ],
  };
}

export function eventJsonLd(event: EventLite) {
  const url = siteUrl();
  const pageUrl = `${url}/event/${event.slug}`;
  const hasTeams = event.teamA && event.teamB;
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "@id": `${pageUrl}/#event`,
    name: event.title,
    url: pageUrl,
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: pageUrl,
    },
    sport: event.sport,
    ...(hasTeams
      ? {
          competitor: [
            {
              "@type": "SportsTeam",
              name: event.teamA!.name,
              ...(event.teamA!.logoUrl ? { logo: event.teamA!.logoUrl } : {}),
            },
            {
              "@type": "SportsTeam",
              name: event.teamB!.name,
              ...(event.teamB!.logoUrl ? { logo: event.teamB!.logoUrl } : {}),
            },
          ],
        }
      : {}),
  };
}
