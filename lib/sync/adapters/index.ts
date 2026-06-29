import type { SourceAdapter } from "./types";
import { thesportsdbAdapter } from "./thesportsdb";
import { referenceAdapter } from "./reference";
import { iccAdapter } from "./icc";

/**
 * Adapter registry — the single pluggable extension point. To add a provider:
 * implement SourceAdapter in a sibling file and register it here. No other code
 * needs to change. Order matters: the first entry is the admin form default.
 */
export const ADAPTERS: Record<string, SourceAdapter> = {
  [thesportsdbAdapter.id]: thesportsdbAdapter, // default data source
  [iccAdapter.id]: iccAdapter,                 // ICC cricket (icc-cricket.com)
  [referenceAdapter.id]: referenceAdapter,     // synthetic / generic-JSON testing
  // [apiFootballAdapter.id]: apiFootballAdapter,   // ← future
};

export function getAdapter(id: string): SourceAdapter | undefined {
  return ADAPTERS[id];
}

export function listAdapters(): SourceAdapter[] {
  return Object.values(ADAPTERS);
}
