import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog/posts";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogIndexJsonLd } from "@/lib/seo/jsonld";
import { Badge } from "@/components/ui/Badge";
import { ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Blog — How to Watch Live Sports & TV Free",
  description:
    "Guides on watching sport TV live, live football today, T Sports and all TV channels live free online in HD on SportixTV — no app, no sign-up.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={blogIndexJsonLd(posts)} />

      <header>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          SportixTV Blog
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Simple guides to watching live sports and TV channels free online — in
          English and Bengali. Find today&apos;s live match, learn how to install
          SportixTV as an app, and more.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-2xl border border-white/5 bg-gradient-to-b from-surface-2 to-surface p-5 transition-all hover:border-brand/30"
          >
            <div className="flex items-center gap-2">
              <Badge variant="brand">{post.lang === "bn" ? "বাংলা" : "English"}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-bold tracking-tight transition-colors group-hover:text-brand">
              {post.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {post.description}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">
              Read more
              <ChevronRightIcon className="size-3.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
