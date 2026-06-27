"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  GridIcon,
  CalendarIcon,
  HeartIcon,
  FlagIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/fixtures", label: "World Cup", Icon: FlagIcon },
  { href: "/categories", label: "Categories", Icon: GridIcon },
  { href: "/events", label: "Events", Icon: CalendarIcon },
  { href: "/favorites", label: "Favorites", Icon: HeartIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-surface/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors",
                active ? "text-brand" : "text-ink-faint",
              )}
            >
              {active && (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand" />
              )}
              <Icon className={cn("size-5 transition-transform", active && "scale-110")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
