import Link from "next/link";
import type { Metadata } from "next";
import { getCategories } from "@/lib/data/categories";
import { ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "All Categories",
  description:
    "Browse all live TV channel categories — sports, news, entertainment, movies, kids, music and more.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div>
      <h1 className="text-2xl font-bold">All Categories</h1>
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
