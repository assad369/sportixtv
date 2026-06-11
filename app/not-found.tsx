import Link from "next/link";
import { TvIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <TvIcon className="size-16 text-ink-faint" />
      <h1 className="text-3xl font-bold">404 — Page Not Found</h1>
      <p className="max-w-md text-ink-muted">
        The channel or page you are looking for doesn’t exist or has been
        removed.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
      >
        Back to Home
      </Link>
    </div>
  );
}
