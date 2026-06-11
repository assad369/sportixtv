import Link from "next/link";
import Image from "next/image";
import { getSettings } from "@/lib/data/settings";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { TvIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/events", label: "Events" },
  { href: "/favorites", label: "Favorites" },
];

export async function Header() {
  const settings = await getSettings();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.siteName}
              width={36}
              height={36}
              className="size-9 rounded-xl object-cover"
            />
          ) : (
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/30 transition-shadow group-hover:shadow-brand/50">
              <TvIcon className="size-5" />
            </span>
          )}
          <span className="text-base font-black tracking-tight text-ink transition-colors group-hover:text-brand">
            {settings.siteName}
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-2 hidden items-center gap-0.5 text-sm md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-4 py-2 font-medium text-ink-muted transition-all hover:bg-surface-2 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchOverlay />
          <InstallPrompt />
        </div>
      </div>
    </header>
  );
}
