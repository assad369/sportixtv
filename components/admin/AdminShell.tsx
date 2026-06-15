"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { MenuIcon, TvIcon, XIcon } from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/channels", label: "Channels" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/autopilot", label: "Autopilot" },
  { href: "/admin/ads", label: "Ad Spots" },
  { href: "/admin/notices", label: "Notices" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand/15 text-brand"
                : "text-ink-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-edge bg-surface lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-edge p-4">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">
            <TvIcon className="size-5" />
          </span>
          <span className="font-bold">Admin</span>
        </div>
        {nav}
        <div className="mt-auto border-t border-edge p-3">
          <p className="truncate px-3 pb-2 text-xs text-ink-faint">{email}</p>
          <form action={logout}>
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-live hover:bg-surface-2">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface">
            <div className="flex items-center justify-between border-b border-edge p-4">
              <span className="font-bold">Admin</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <XIcon className="size-5" />
              </button>
            </div>
            {nav}
            <div className="mt-auto border-t border-edge p-3">
              <form action={logout}>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-live hover:bg-surface-2">
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-edge bg-surface px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <MenuIcon className="size-6" />
          </button>
          <span className="font-bold">Admin</span>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
