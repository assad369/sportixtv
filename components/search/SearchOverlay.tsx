"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchIcon, XIcon } from "@/components/icons";

interface Result {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
}

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, close]);

  useEffect(() => {
    const q = query.trim();
    const timer = setTimeout(
      async () => {
        if (q.length < 2) {
          setResults([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          });
          if (res.ok) setResults((await res.json()).results ?? []);
        } catch {
          // aborted or network error — keep previous results
        } finally {
          setLoading(false);
        }
      },
      q.length < 2 ? 0 : 250,
    );
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search channels"
        className="flex h-9 items-center gap-2 rounded-lg border border-edge bg-surface px-3 text-sm text-ink-faint transition-colors hover:border-brand/50 hover:text-ink-muted"
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Search channels…</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="mx-auto max-w-2xl px-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-faint" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search channels…"
                  className="h-12 w-full rounded-xl border border-edge bg-surface pl-11 pr-4 text-base text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
                />
              </div>
              <button
                onClick={close}
                aria-label="Close search"
                className="grid size-12 place-items-center rounded-xl border border-edge bg-surface text-ink-muted hover:text-ink"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-xl">
              {loading && (
                <p className="py-8 text-center text-sm text-ink-faint">
                  Searching…
                </p>
              )}
              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="py-8 text-center text-sm text-ink-faint">
                  No channels found for “{query.trim()}”
                </p>
              )}
              <ul className="divide-y divide-edge">
                {results.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/channel/${r.slug}`}
                      onClick={close}
                      className="flex items-center gap-3 px-2 py-3 hover:bg-surface-2 rounded-lg"
                    >
                      <Image
                        src={r.logoUrl}
                        alt=""
                        width={44}
                        height={44}
                        className="size-11 rounded-lg bg-surface-2 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.name}</p>
                        <p className="truncate text-xs text-ink-faint">
                          {r.description}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
