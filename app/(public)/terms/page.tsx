import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "SportixTV Terms of Service — the rules and conditions governing your use of our free live sports and TV streaming platform.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const settings = await getSettings();
  const siteName = settings.siteName;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sportixtv.online";

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-xs text-ink-faint">Last updated: June 2025</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">1. Acceptance of Terms</h2>
          <p>
            By accessing or using {siteName} ({siteUrl}), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use our
            Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">2. Description of Service</h2>
          <p>
            {siteName} is a free online platform that aggregates and links to publicly
            available live TV streams and sports events hosted by third-party providers.
            We do not host, store, or upload any video or media content on our servers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">3. Permitted Use</h2>
          <p>You may use {siteName} for personal, non-commercial viewing only. You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Reproduce, redistribute, or re-embed our content without permission</li>
            <li>Use automated tools, bots, or scrapers to access our Service</li>
            <li>Attempt to bypass any security measures or access admin areas</li>
            <li>Use the Service for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">4. Intellectual Property</h2>
          <p>
            All stream content is owned by the original rights holders and third-party
            providers. {siteName} claims no ownership over streamed content. The{" "}
            {siteName} website design, logo, and original code are the property of{" "}
            {siteName}.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">5. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. We do not
            guarantee uninterrupted access, stream quality, or the accuracy of scheduling
            information. Streams may go offline without notice due to third-party
            decisions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">6. Limitation of Liability</h2>
          <p>
            {siteName} shall not be liable for any indirect, incidental, or consequential
            damages arising from your use of the Service, including but not limited to
            stream unavailability, buffering, or content removal.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">7. Third-Party Content</h2>
          <p>
            {siteName} links to streams hosted on third-party servers. We have no control
            over third-party content and are not responsible for its accuracy, legality,
            or quality. Use of third-party content is governed by those parties&apos; terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">8. Advertising</h2>
          <p>
            {siteName} displays advertisements to fund the free service. By using the
            Service, you agree to the display of ads. Ad blockers may affect the
            functionality of some features.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the
            Service after changes constitutes acceptance of the new Terms. The &quot;Last
            updated&quot; date above reflects when these Terms were last revised.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">10. Governing Law</h2>
          <p>
            These Terms are governed by applicable international law. Any disputes will be
            resolved through good-faith negotiation before any legal proceedings.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">11. Contact</h2>
          <p>
            For questions about these Terms, reach us via our{" "}
            <a href="/contact" className="text-brand hover:underline">
              Contact page
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
