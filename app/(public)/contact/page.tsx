import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with SportixTV for support, broken stream reports, advertising inquiries, or general questions. We respond within 24 hours.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const socials = Object.entries(settings.socialLinks).filter(([, v]) => v);
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Contact Us</h1>
      <div className="mt-4 space-y-4 text-ink-muted">
        <p>
          Have a question, found a broken stream, or want to advertise with us?
          Reach out through any of our social channels below — we usually
          respond within 24 hours.
        </p>
        {socials.length > 0 ? (
          <ul className="space-y-2">
            {socials.map(([key, url]) => (
              <li key={key}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand capitalize hover:underline"
                >
                  {key}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>Social links will be available soon.</p>
        )}
      </div>
    </article>
  );
}
