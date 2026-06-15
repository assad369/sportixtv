import type { SourceAdapter } from "./types";
import { referenceAdapter } from "./reference";

/**
 * Adapter registry — the single pluggable extension point. To add a provider:
 * implement SourceAdapter in a sibling file and register it here. No other code
 * needs to change.
 */
export const ADAPTERS: Record<string, SourceAdapter> = {
  [referenceAdapter.id]: referenceAdapter,
  // [apiFootballAdapter.id]: apiFootballAdapter,   // ← future
  // [cricApiAdapter.id]: cricApiAdapter,           // ← future
};

export function getAdapter(id: string): SourceAdapter | undefined {
  return ADAPTERS[id];
}

export function listAdapters(): SourceAdapter[] {
  return Object.values(ADAPTERS);
}
