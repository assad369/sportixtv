import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "SportixTV Privacy Policy — how we collect, use, and protect your information when you use our live streaming platform.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const settings = await getSettings();
  const siteName = settings.siteName;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sportixtv.online";

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-xs text-ink-faint">Last updated: June 2025</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">1. Introduction</h2>
          <p>
            Welcome to {siteName} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We operate the website{" "}
            <a href={siteUrl} className="text-brand hover:underline">
              {siteUrl}
            </a>{" "}
            (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, and
            protect information when you use our Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Usage Data:</strong> Pages visited, channels watched, time spent, browser
              type, device type, and IP address (anonymized).
            </li>
            <li>
              <strong>Cookies & Local Storage:</strong> We use cookies and browser local
              storage to remember your preferences (e.g., favorite channels) and to serve
              relevant advertisements.
            </li>
            <li>
              <strong>Analytics Data:</strong> We use Google Analytics (GA4) to understand
              how visitors use our site. Google Analytics collects anonymized usage data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">3. How We Use Your Information</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>To operate and improve our streaming platform</li>
            <li>To personalize content and remember your favorites</li>
            <li>To display relevant advertisements via third-party ad networks</li>
            <li>To analyze traffic patterns and fix technical issues</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">4. Third-Party Services</h2>
          <p>
            Our Service uses third-party services that may collect information. These include:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Google Analytics</strong> — for website analytics (
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                Google Privacy Policy
              </a>
              )
            </li>
            <li>
              <strong>Advertising Networks</strong> — we work with ad partners to display
              ads. These partners may use cookies to show relevant ads.
            </li>
            <li>
              <strong>Embedded Streams</strong> — video streams are hosted by third parties.
              Their privacy policies apply when you watch their streams.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">5. Cookies</h2>
          <p>
            We use essential cookies for site functionality and analytics cookies to improve
            our service. You can disable cookies in your browser settings, though some
            features may not work correctly without them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">6. Data Retention</h2>
          <p>
            We retain anonymized analytics data for up to 26 months. Locally stored
            preferences (favorites) are stored in your browser until you clear them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Access the personal data we hold about you</li>
            <li>Request deletion of your data</li>
            <li>Opt out of analytics tracking (use browser Do Not Track or opt-out tools)</li>
          </ul>
          <p className="mt-2">
            Contact us via our{" "}
            <a href="/contact" className="text-brand hover:underline">
              Contact page
            </a>{" "}
            to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">8. Children&apos;s Privacy</h2>
          <p>
            Our Service is not directed to children under 13. We do not knowingly collect
            personal information from children. If you believe a child has provided us
            information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify users by
            updating the &quot;Last updated&quot; date above. Continued use of the Service
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">10. Contact</h2>
          <p>
            For privacy-related questions, reach us via our{" "}
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
