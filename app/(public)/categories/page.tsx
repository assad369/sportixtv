import Link from "next/link";
import type { Metadata } from "next";
import { getCategories } from "@/lib/data/categories";
import { ChevronRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { categoriesListJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Live TV Categories — Sports, News, Entertainment & More",
  description:
    "Browse all live TV channel categories — sports, cricket, football, news, entertainment, movies, kids, music and more. Watch free in HD.",
  keywords: ["live tv categories", "sports channels", "news channels", "entertainment channels", "free live streaming"],
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div>
      <JsonLd data={categoriesListJsonLd(categories)} />
      <h1 className="text-2xl font-bold">All Live TV Categories</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Browse {categories.length} categories of live TV channels — all free, no sign-up required.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="group flex items-center justify-between rounded-xl border border-edge bg-surface p-5 transition-all hover:border-brand/60 hover:bg-surface-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <span className="font-semibold">{c.name}</span>
            </div>
            <ChevronRightIcon className="size-5 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  );
}
