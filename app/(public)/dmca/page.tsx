import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "DMCA / Content Removal Policy",
  description:
    "SportixTV DMCA policy and content removal process. We respect intellectual property rights and process valid takedown notices within 48 hours.",
  alternates: { canonical: "/dmca" },
};

export default async function DmcaPage() {
  const settings = await getSettings();
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">DMCA / Content Removal Policy</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>
          {settings.siteName} does not host, upload, or store any video,
          media files, or live streams on its servers. All content accessible
          through this website is embedded from or links to streams hosted by
          third-party services that are publicly available on the internet.
        </p>
        <p>
          We respect the intellectual property rights of others. If you are a
          copyright owner (or authorized to act on behalf of one) and believe
          that content linked through this site infringes your copyright, please
          send a takedown notice with the following information:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Identification of the copyrighted work claimed to be infringed</li>
          <li>The exact URL(s) on this site where the material appears</li>
          <li>Your contact information (name, email, organization)</li>
          <li>
            A statement that you have a good-faith belief the use is not
            authorized by the copyright owner
          </li>
          <li>
            A statement, under penalty of perjury, that the information in your
            notice is accurate
          </li>
        </ul>
        <p>
          Send notices via our{" "}
          <a href="/contact" className="text-brand hover:underline">
            contact channels
          </a>
          . Valid requests are processed within 48 hours and the corresponding
          links removed.
        </p>
      </div>
    </article>
  );
}
