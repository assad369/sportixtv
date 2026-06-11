import type { Metadata } from "next";
import { StoredChannelGrid } from "@/components/channels/StoredChannelGrid";

export const metadata: Metadata = {
  title: "My Favorites",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold">❤️ My Favorites</h1>
        <div className="mt-5">
          <StoredChannelGrid
            storageKey="stv:favorites"
            emptyText="No favorites yet — tap the heart on any channel."
          />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold">🕘 Recently Watched</h2>
        <div className="mt-3">
          <StoredChannelGrid
            storageKey="stv:recent"
            emptyText="Channels you watch will appear here."
          />
        </div>
      </section>
    </div>
  );
}
