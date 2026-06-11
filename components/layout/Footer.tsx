import Link from "next/link";
import { getSettings } from "@/lib/data/settings";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  telegram: "Telegram",
  twitter: "Twitter",
  youtube: "YouTube",
};

export async function Footer() {
  const settings = await getSettings();
  const socials = Object.entries(settings.socialLinks).filter(([, v]) => v);
  return (
    <footer className="mt-12 border-t border-edge bg-surface pb-20 md:pb-6">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <p className="text-lg font-bold">{settings.siteName}</p>
            <p className="mt-1 text-sm text-ink-muted">{settings.tagline}</p>
            <p className="mt-3 text-xs text-ink-faint">
              {settings.siteName} does not host any media content. All streams
              are provided by third parties. For content removal, see our DMCA
              page.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-ink-muted">Pages</p>
              <Link href="/about" className="text-ink-faint hover:text-ink">
                About
              </Link>
              <Link href="/contact" className="text-ink-faint hover:text-ink">
                Contact
              </Link>
              <Link href="/dmca" className="text-ink-faint hover:text-ink">
                DMCA
              </Link>
            </div>
            {socials.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-ink-muted">Follow us</p>
                {socials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-faint hover:text-ink"
                  >
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-ink-faint">
          © {settings.siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
