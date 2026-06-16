import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import type { PostBlock } from "@/lib/blog/posts";

/**
 * Renders structured post content blocks as semantic HTML using the site's
 * existing design tokens. No markdown/MDX dependency, no dangerouslySetInnerHTML.
 */
export function PostBody({ blocks }: { blocks: PostBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="mt-4 flex items-center gap-2.5 text-xl font-black tracking-tight"
              >
                <span className="section-accent" />
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-2 text-base font-bold tracking-tight">
                {block.text}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex gap-2 text-sm leading-relaxed text-ink-muted"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "cta":
            return (
              <Link
                key={i}
                href={block.href}
                className="inline-flex w-fit items-center gap-1 rounded-xl border border-white/5 px-4 py-2 text-sm font-semibold text-ink-muted transition-all hover:border-brand/30 hover:text-brand"
              >
                {block.label}
                <ChevronRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            );
          case "p":
          default:
            return (
              <p key={i} className="text-sm leading-relaxed text-ink-muted">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
