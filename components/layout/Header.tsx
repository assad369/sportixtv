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
    <header className="sticky top-0 z-40 border-b border-edge bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.siteName}
              width={32}
              height={32}
              className="size-8 rounded"
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">
              <TvIcon className="size-5" />
            </span>
          )}
          <span className="text-lg font-bold tracking-tight">
            {settings.siteName}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-1 text-sm"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
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
