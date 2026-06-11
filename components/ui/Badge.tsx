import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "live" | "brand" | "outline";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        variant === "default" && "bg-surface-3 text-ink-muted",
        variant === "live" && "bg-live/15 text-live ring-1 ring-live/30",
        variant === "brand" && "bg-brand/12 text-brand ring-1 ring-brand/25",
        variant === "outline" && "border border-white/10 text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-live/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-live ring-1 ring-live/30",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-70 animate-ping" />
        <span className="relative inline-flex size-1.5 rounded-full bg-live" />
      </span>
      Live
    </span>
  );
}
