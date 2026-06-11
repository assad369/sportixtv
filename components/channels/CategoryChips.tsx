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
    <div className="rail-scroll flex gap-2 overflow-x-auto pb-1">
      <Link
        href="/categories"
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !activeSlug
            ? "border-brand bg-brand/15 text-brand"
            : "border-edge bg-surface text-ink-muted hover:border-brand/50 hover:text-ink",
        )}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/category/${c.slug}`}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            activeSlug === c.slug
              ? "border-brand bg-brand/15 text-brand"
              : "border-edge bg-surface text-ink-muted hover:border-brand/50 hover:text-ink",
          )}
        >
          {c.icon} {c.name}
        </Link>
      ))}
    </div>
  );
}
