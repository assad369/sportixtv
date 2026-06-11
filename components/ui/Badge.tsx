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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variant === "default" && "bg-surface-3 text-ink-muted",
        variant === "live" && "bg-live text-white",
        variant === "brand" && "bg-brand/15 text-brand",
        variant === "outline" && "border border-edge text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LiveBadge({ className }: { className?: string }) {
  return (
    <Badge variant="live" className={className}>
      <span className="size-1.5 rounded-full bg-white animate-pulse-live" />
      Live
    </Badge>
  );
}
