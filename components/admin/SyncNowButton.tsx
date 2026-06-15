"use client";

import { useFormStatus } from "react-dom";
import { triggerSyncNow } from "@/lib/actions/fixtures";
import { Button } from "@/components/ui/Button";

function SubmitButton({
  label,
  size,
}: {
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} disabled={pending}>
      {pending ? "Syncing…" : label}
    </Button>
  );
}

/**
 * Triggers a manual sync. With no `sourceId` it runs every enabled source;
 * pass a sourceId to sync just one.
 */
export function SyncNowButton({
  sourceId,
  label = "Sync now",
  size = "md",
}: {
  sourceId?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <form action={triggerSyncNow}>
      {sourceId && <input type="hidden" name="sourceId" value={sourceId} />}
      <SubmitButton label={label} size={size} />
    </form>
  );
}
