"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  GridIcon,
  CalendarIcon,
  HeartIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/categories", label: "Categories", Icon: GridIcon },
  { href: "/events", label: "Events", Icon: CalendarIcon },
  { href: "/favorites", label: "Favorites", Icon: HeartIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-surface/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px]",
                active ? "text-brand" : "text-ink-muted",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
