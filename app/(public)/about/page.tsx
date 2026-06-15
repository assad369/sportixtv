import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { JsonLd } from "@/components/seo/JsonLd";
import { aboutPageJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "About Us — Free Live Sports & TV Streaming",
  description:
    "SportixTV is a free live sports and TV streaming platform. Watch cricket, football, news, entertainment and more — no registration, no subscription, on any device.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <article className="prose-invert mx-auto max-w-2xl">
      <JsonLd data={aboutPageJsonLd(settings)} />
      <h1 className="text-2xl font-bold">About {settings.siteName}</h1>
      <div className="mt-4 space-y-4 text-ink-muted">
        <p>{settings.tagline}</p>
        <p>
          {settings.siteName} is a free live TV and sports streaming platform. We
          aggregate publicly available live streams of sports events and TV
          channels so you can watch your favorite content from any device —
          mobile, tablet, desktop or smart TV — without registration or
          subscription.
        </p>
        <p>
          Our platform covers a wide range of content: live cricket matches
          (IPL, PSL, international), football (Premier League, La Liga, UEFA),
          news channels, entertainment, movies, kids&apos; channels, music, and more
          — all in HD quality, free of charge.
        </p>
        <p>
          We do not host, upload or store any video content on our servers.
          All streams are provided by third-party sources. If you have any
          questions or concerns about content, please see our{" "}
          <a href="/dmca" className="text-brand hover:underline">DMCA page</a>.
        </p>
      </div>
    </article>
  );
}
