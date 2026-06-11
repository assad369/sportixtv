import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-edge bg-surface px-3 text-sm text-ink",
        "placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink",
        "placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-edge bg-surface px-3 text-sm text-ink",
        "focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}
