import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug } from "@/lib/data/categories";
import { getChannelsByCategoryId } from "@/lib/data/channels";
import { ChannelGrid } from "@/components/channels/ChannelGrid";
import { CategoryChips } from "@/components/channels/CategoryChips";
import { JsonLd } from "@/components/seo/JsonLd";
import { categoryPageJsonLd } from "@/lib/seo/jsonld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} Live TV Channels — Watch Free in HD`,
    description: `Stream ${category.name.toLowerCase()} TV channels live online for free in HD quality. No registration needed. Watch on any device.`,
    keywords: [`${category.name} live tv`, `${category.name} channels`, "live streaming", "free tv", "HD streaming"],
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
      <JsonLd data={categoryPageJsonLd(category.name, slug, channels)} />
      <CategoryChips categories={categories} activeSlug={slug} />
      <h1 className="text-2xl font-bold">
        {category.icon} {category.name} Live Channels
      </h1>
      <ChannelGrid
        channels={channels}
        emptyText={`No ${category.name.toLowerCase()} channels available yet.`}
      />
    </div>
  );
}
