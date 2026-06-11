import { getNotices } from "@/lib/data/notices";
import { getSettings } from "@/lib/data/settings";

export async function NoticeTicker() {
  const [settings, items] = await Promise.all([getSettings(), getNotices()]);
  if (!settings.tickerEnabled || items.length === 0) return null;

  return (
    <div className="overflow-hidden border-b border-edge bg-surface">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-1.5">
        <span className="shrink-0 rounded bg-live px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          Notice
        </span>
        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee whitespace-nowrap text-sm text-ink-muted">
            {items.map((n) =>
              n.linkUrl ? (
                <a
                  key={n.id}
                  href={n.linkUrl}
                  className="mx-6 hover:text-brand"
                >
                  {n.text}
                </a>
              ) : (
                <span key={n.id} className="mx-6">
                  {n.text}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
