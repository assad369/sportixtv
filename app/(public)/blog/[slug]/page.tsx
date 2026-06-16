import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog/posts";
import { PostBody } from "@/components/blog/PostBody";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPostingJsonLd } from "@/lib/seo/jsonld";
import { Badge } from "@/components/ui/Badge";
import { ChevronRightIcon } from "@/components/icons";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.sportixtv.online";
  const locale = post.lang === "bn" ? "bn_BD" : "en_US";
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${slug}`,
      siteName: "SportixTV",
      locale,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={blogPostingJsonLd(post)} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs font-medium text-ink-faint">
        <Link href="/" className="hover:text-ink-muted">
          Home
        </Link>
        <span className="px-1.5">/</span>
        <Link href="/blog" className="hover:text-ink-muted">
          Blog
        </Link>
      </nav>

      <header className="mt-3">
        <Badge variant="brand">{post.lang === "bn" ? "বাংলা" : "English"}</Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {post.description}
        </p>
      </header>

      <div className="mt-8">
        <PostBody blocks={post.body} />
      </div>

      {/* FAQ */}
      {post.faqs?.length ? (
        <section className="mt-12" aria-label="Frequently asked questions">
          <h2 className="flex items-center gap-2.5 text-xl font-black tracking-tight">
            <span className="section-accent" />
            {post.lang === "bn" ? "সাধারণ প্রশ্ন" : "Frequently Asked Questions"}
          </h2>
          <div className="mt-5 flex flex-col gap-4">
            {post.faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-surface-2 p-4"
              >
                <h3 className="text-sm font-bold tracking-tight">{faq.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Primary CTA */}
      <div className="mt-12 rounded-2xl border border-brand/20 bg-brand/5 p-6 text-center">
        <p className="text-base font-bold tracking-tight">
          {post.lang === "bn"
            ? "এখনই লাইভ টিভি দেখা শুরু করুন"
            : "Start watching live TV now"}
        </p>
        <Link
          href="/"
          className="mt-3 inline-flex items-center gap-1 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark"
        >
          {post.lang === "bn" ? "লাইভ চ্যানেল দেখুন" : "Browse live channels"}
          <ChevronRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-12" aria-label="Related articles">
          <h2 className="flex items-center gap-2.5 text-xl font-black tracking-tight">
            <span className="section-accent" />
            {post.lang === "bn" ? "আরও পড়ুন" : "Related articles"}
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-surface-2 p-4 transition-all hover:border-brand/30"
              >
                <span className="text-sm font-semibold transition-colors group-hover:text-brand">
                  {r.title}
                </span>
                <ChevronRightIcon
                  className="size-4 shrink-0 text-ink-faint"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
