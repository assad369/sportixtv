"use client";

import { useSyncExternalStore } from "react";
import { HeartIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const FAVORITES_KEY = "stv:favorites";
const CHANGE_EVENT = "stv:favorites-changed";

export function readFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function FavoriteButton({ channelSlug }: { channelSlug: string }) {
  const isFavorite = useSyncExternalStore(
    subscribe,
    () => readFavorites().includes(channelSlug),
    () => false, // server snapshot
  );

  const toggle = () => {
    const favorites = readFavorites();
    const next = favorites.includes(channelSlug)
      ? favorites.filter((s) => s !== channelSlug)
      : [...favorites, channelSlug];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        isFavorite
          ? "border-live/50 bg-live/10 text-live"
          : "border-edge bg-surface text-ink-muted hover:border-live/50 hover:text-live",
      )}
    >
      <HeartIcon className="size-4" filled={isFavorite} />
      {isFavorite ? "Favorited" : "Favorite"}
    </button>
  );
}
