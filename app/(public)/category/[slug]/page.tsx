import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug } from "@/lib/data/categories";
import { getChannelsByCategoryId } from "@/lib/data/channels";
import { ChannelGrid } from "@/components/channels/ChannelGrid";
import { CategoryChips } from "@/components/channels/CategoryChips";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} Channels — Watch Live`,
    description: `Watch ${category.name.toLowerCase()} TV channels live online for free in HD.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [categories, channels] = await Promise.all([
    getCategories(),
    getChannelsByCategoryId(category.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <CategoryChips categories={categories} activeSlug={slug} />
      <h1 className="text-2xl font-bold">
        {category.icon} {category.name} Channels
      </h1>
      <ChannelGrid
        channels={channels}
        emptyText={`No ${category.name.toLowerCase()} channels available yet.`}
      />
    </div>
  );
}
