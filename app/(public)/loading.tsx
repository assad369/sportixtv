import { Skeleton } from "@/components/ui/Skeleton";
import { ChannelGridSkeleton } from "@/components/channels/ChannelGridSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="rail-scroll flex gap-3 overflow-x-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-64 shrink-0 sm:w-72" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <ChannelGridSkeleton />
    </div>
  );
}
