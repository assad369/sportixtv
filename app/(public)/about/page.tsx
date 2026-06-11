import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "About Us",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <article className="prose-invert mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">About {settings.siteName}</h1>
      <div className="mt-4 space-y-4 text-ink-muted">
        <p>{settings.tagline}</p>
        <p>
          {settings.siteName} is a live TV and sports streaming directory. We
          aggregate publicly available live streams of sports events and TV
          channels so you can watch your favorite content from any device —
          mobile, tablet, desktop or smart TV.
        </p>
        <p>
          We do not host, upload or store any video content on our servers.
          All streams are provided by third-party sources. If you have any
          questions or concerns about content, please see our DMCA page.
        </p>
      </div>
    </article>
  );
}
