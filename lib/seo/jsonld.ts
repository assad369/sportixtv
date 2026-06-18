import type { ChannelLite } from "@/lib/data/channels";
import type { EventLite } from "@/lib/data/events";
import type { SiteSettings } from "@/lib/db/schemas/settings";
import type { BlogPost } from "@/lib/blog/posts";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.sportixtv.online";
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
        inLanguage: "en-US",
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
        description: settings.seoDescription,
        ...(settings.logoUrl
          ? {
              logo: {
                "@type": "ImageObject",
                url: settings.logoUrl,
                width: 512,
                height: 512,
              },
            }
          : {}),
        sameAs: Object.values(settings.socialLinks).filter(Boolean),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          availableLanguage: "English",
          ...(settings.socialLinks.telegram
            ? { url: settings.socialLinks.telegram }
            : {}),
        },
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
      breadcrumbJsonLd([
        { name: "Home", url },
        { name: channel.name, url: pageUrl },
      ]),
      {
        "@type": "BroadcastService",
        "@id": `${pageUrl}/#broadcast`,
        name: channel.name,
        description: channel.description || `Watch ${channel.name} live`,
        url: pageUrl,
        logo: {
          "@type": "ImageObject",
          url: channel.logoUrl,
        },
        provider: { "@id": `${url}/#organization` },
        ...(channel.language ? { inLanguage: channel.language } : {}),
      },
      {
        "@type": "VideoObject",
        "@id": `${pageUrl}/#video`,
        name: `Watch ${channel.name} Live`,
        description:
          channel.description ||
          `Watch ${channel.name} live stream online in HD on ${settings.siteName}. Free live streaming available 24/7.`,
        thumbnailUrl: [channel.logoUrl],
        uploadDate: "2024-01-01T00:00:00+00:00",
        contentUrl: pageUrl,
        embedUrl: pageUrl,
        isLiveBroadcast: true,
        publication: {
          "@type": "BroadcastEvent",
          isLiveBroadcast: true,
          videoFormat: "HD",
          startDate: "2024-01-01T00:00:00Z",
        },
        publisher: { "@id": `${url}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        url: pageUrl,
        name: `Watch ${channel.name} Live`,
        description: `Stream ${channel.name} live online in HD for free.`,
        isPartOf: { "@id": `${url}/#website` },
        about: { "@id": `${pageUrl}/#broadcast` },
        breadcrumb: { "@id": `${pageUrl}/#breadcrumb` },
      },
    ],
  };
}

export function eventJsonLd(event: EventLite) {
  const url = siteUrl();
  const pageUrl = `${url}/event/${event.slug}`;
  const hasTeams = event.teamA && event.teamB;
  const eventName = hasTeams
    ? `${event.teamA!.name} vs ${event.teamB!.name}`
    : event.title;
  const description = `Watch ${event.title} live online for free in HD. ${event.league ?? event.sport} live streaming on SportixTV.`;
  const images = [event.teamA?.logoUrl, event.teamB?.logoUrl].filter(
    (v): v is string => Boolean(v),
  );

  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", url },
        { name: "Events", url: `${url}/events` },
        { name: eventName, url: pageUrl },
      ]),
      {
        "@type": "SportsEvent",
        "@id": `${pageUrl}/#event`,
        name: event.title,
        description,
        url: pageUrl,
        ...(images.length ? { image: images } : {}),
        startDate: event.startsAt,
        ...(event.endsAt ? { endDate: event.endsAt } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: {
          "@type": "VirtualLocation",
          url: pageUrl,
        },
        sport: event.sport,
        ...(event.league ? { organizer: { "@type": "Organization", name: event.league } } : {}),
        ...(hasTeams
          ? {
              competitor: [
                {
                  "@type": "SportsTeam",
                  name: event.teamA!.name,
                  ...(event.teamA!.logoUrl
                    ? { logo: { "@type": "ImageObject", url: event.teamA!.logoUrl } }
                    : {}),
                },
                {
                  "@type": "SportsTeam",
                  name: event.teamB!.name,
                  ...(event.teamB!.logoUrl
                    ? { logo: { "@type": "ImageObject", url: event.teamB!.logoUrl } }
                    : {}),
                },
              ],
            }
          : {}),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          validFrom: event.startsAt,
          url: pageUrl,
        },
      },
      {
        "@type": "VideoObject",
        "@id": `${pageUrl}/#video`,
        name: `Watch ${eventName} Live`,
        description,
        ...(images.length ? { thumbnailUrl: images } : {}),
        uploadDate: event.startsAt,
        contentUrl: pageUrl,
        embedUrl: pageUrl,
        isLiveBroadcast: true,
        publication: {
          "@type": "BroadcastEvent",
          isLiveBroadcast: true,
          startDate: event.startsAt,
          ...(event.endsAt ? { endDate: event.endsAt } : {}),
        },
        publisher: { "@id": `${url}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        url: pageUrl,
        name: `Watch ${eventName} Live`,
        description,
        isPartOf: { "@id": `${url}/#website` },
        about: { "@id": `${pageUrl}/#event` },
        breadcrumb: { "@id": `${pageUrl}/#breadcrumb` },
      },
    ],
  };
}

export function categoryPageJsonLd(
  categoryName: string,
  categorySlug: string,
  channels: { name: string; slug: string; description: string; logoUrl: string }[],
) {
  const url = siteUrl();
  const pageUrl = `${url}/category/${categorySlug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", url },
        { name: "Categories", url: `${url}/categories` },
        { name: `${categoryName} Channels`, url: pageUrl },
      ]),
      {
        "@type": "ItemList",
        "@id": `${pageUrl}/#list`,
        name: `${categoryName} Live TV Channels`,
        description: `Watch ${categoryName.toLowerCase()} TV channels live online for free in HD.`,
        numberOfItems: channels.length,
        itemListElement: channels.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          url: `${url}/channel/${c.slug}`,
          image: c.logoUrl,
          description: c.description || `Watch ${c.name} live`,
        })),
      },
    ],
  };
}

export function categoriesListJsonLd(
  categories: { name: string; slug: string; icon: string }[],
) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Live TV Channel Categories",
    description: "Browse all live TV and sports channel categories.",
    numberOfItems: categories.length,
    itemListElement: categories.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.icon} ${c.name}`,
      url: `${url}/category/${c.slug}`,
    })),
  };
}

export function eventsListJsonLd(
  events: { title: string; slug: string; startsAt: string | Date; sport: string }[],
) {
  const url = siteUrl();
  const pageUrl = `${url}/events`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", url },
        { name: "Events", url: pageUrl },
      ]),
      {
        "@type": "ItemList",
        "@id": `${pageUrl}/#list`,
        name: "Live Sports Events",
        description: "Watch live and upcoming sports events online for free.",
        numberOfItems: events.length,
        itemListElement: events.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: e.title,
          url: `${url}/event/${e.slug}`,
        })),
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        url: pageUrl,
        name: "Live Sports Events & Match Schedule",
        description: "Watch live and upcoming sports events online for free.",
        isPartOf: { "@id": `${url}/#website` },
        about: { "@id": `${pageUrl}/#list` },
        breadcrumb: { "@id": `${pageUrl}/#breadcrumb` },
      },
    ],
  };
}

export function homePageFaqJsonLd(siteName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${siteName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${siteName} is a free live sports and TV streaming platform where you can watch live channels, sports events, cricket, football, news, entertainment and more in HD quality.`,
        },
      },
      {
        "@type": "Question",
        name: `Is ${siteName} free to use?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, ${siteName} is completely free. No registration or subscription is required. Simply visit the website and start watching live TV channels and sports events instantly.`,
        },
      },
      {
        "@type": "Question",
        name: "What sports can I watch live?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can watch live cricket, football (soccer), basketball, tennis, rugby, boxing, MMA, Formula 1, and many other sports on ${siteName} for free.`,
        },
      },
      {
        "@type": "Question",
        name: "Can I watch live TV channels on mobile?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, ${siteName} is fully mobile-friendly. You can watch live TV channels and sports streams on any device — mobile phone, tablet, laptop, desktop, or smart TV — without installing any app.`,
        },
      },
      {
        "@type": "Question",
        name: "Where can I watch cricket live online for free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `${siteName} streams live cricket matches including international test matches, ODIs, T20s, IPL, PSL, BBL, and more — all free and in HD quality.`,
        },
      },
    ],
  };
}

export function aboutPageJsonLd(settings: SiteSettings) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}/about/#webpage`,
        url: `${url}/about`,
        name: `About ${settings.siteName}`,
        description: `Learn about ${settings.siteName} — a free live sports and TV streaming platform.`,
        isPartOf: { "@id": `${url}/#website` },
        about: { "@id": `${url}/#organization` },
        breadcrumb: breadcrumbJsonLd([
          { name: "Home", url },
          { name: "About", url: `${url}/about` },
        ]),
      },
    ],
  };
}

export function blogIndexJsonLd(posts: BlogPost[]) {
  const url = siteUrl();
  const pageUrl = `${url}/blog`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", url },
        { name: "Blog", url: pageUrl },
      ]),
      {
        "@type": "Blog",
        "@id": `${pageUrl}/#blog`,
        name: "SportixTV Blog",
        description:
          "Guides on watching live sports & TV channels free online — Sport TV live, live football, T Sports and more.",
        url: pageUrl,
        publisher: { "@id": `${url}/#organization` },
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${url}/blog/${p.slug}`,
          datePublished: p.publishedAt,
          dateModified: p.updatedAt,
          inLanguage: p.lang === "bn" ? "bn-BD" : "en-US",
        })),
      },
    ],
  };
}

export function blogPostingJsonLd(post: BlogPost) {
  const url = siteUrl();
  const pageUrl = `${url}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "Home", url },
        { name: "Blog", url: `${url}/blog` },
        { name: post.title, url: pageUrl },
      ]),
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}/#article`,
        headline: post.title,
        description: post.description,
        url: pageUrl,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        inLanguage: post.lang === "bn" ? "bn-BD" : "en-US",
        keywords: post.keywords.join(", "),
        author: { "@id": `${url}/#organization` },
        publisher: { "@id": `${url}/#organization` },
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        isPartOf: { "@id": `${url}/blog/#blog` },
      },
      ...(post.faqs?.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}/#faq`,
              mainEntity: post.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };
}

function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${items[items.length - 1].url}/#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
