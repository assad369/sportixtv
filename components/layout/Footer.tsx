import Link from "next/link";
import { getSettings } from "@/lib/data/settings";
import { TvIcon } from "@/components/icons";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  telegram: "Telegram",
  twitter: "Twitter / X",
  youtube: "YouTube",
};

export async function Footer() {
  const settings = await getSettings();
  const socials = Object.entries(settings.socialLinks).filter(([, v]) => v);
  return (
    <footer className="mt-12 border-t border-white/5 bg-surface pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/20">
                <TvIcon className="size-4" />
              </span>
              <p className="text-base font-black tracking-tight">{settings.siteName}</p>
            </div>
            {settings.tagline && (
              <p className="mt-2 text-sm font-medium text-ink-muted">{settings.tagline}</p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">
              {settings.siteName} does not host any media content. All streams are
              provided by third parties. For content removal, see our{" "}
              <Link href="/dmca" className="underline underline-offset-2 hover:text-ink-muted">
                DMCA page
              </Link>
              .
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                Pages
              </p>
              <Link href="/about" className="font-medium text-ink-muted transition-colors hover:text-ink">
                About
              </Link>
              <Link href="/contact" className="font-medium text-ink-muted transition-colors hover:text-ink">
                Contact
              </Link>
              <Link href="/dmca" className="font-medium text-ink-muted transition-colors hover:text-ink">
                DMCA
              </Link>
            </div>
            {socials.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                  Follow us
                </p>
                {socials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink-muted transition-colors hover:text-ink"
                  >
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-1 border-t border-white/5 pt-6">
          <p className="text-xs text-ink-faint">
            © {settings.siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
