import Link from "next/link";
import type { CategoryLite } from "@/lib/data/categories";
import { cn } from "@/lib/utils";

export function CategoryChips({
  categories,
  activeSlug,
}: {
  categories: CategoryLite[];
  activeSlug?: string;
}) {
  return (
    <div className="rail-scroll flex gap-2 overflow-x-auto pb-1.5">
      <Link
        href="/categories"
        className={cn(
          "shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200",
          !activeSlug
            ? "border-brand/40 bg-brand/15 text-brand shadow-md shadow-brand/10"
            : "border-white/5 bg-surface text-ink-muted hover:border-white/10 hover:bg-surface-2 hover:text-ink",
        )}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/category/${c.slug}`}
          className={cn(
            "shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200",
            activeSlug === c.slug
              ? "border-brand/40 bg-brand/15 text-brand shadow-md shadow-brand/10"
              : "border-white/5 bg-surface text-ink-muted hover:border-white/10 hover:bg-surface-2 hover:text-ink",
          )}
        >
          {c.icon} {c.name}
        </Link>
      ))}
    </div>
  );
}
