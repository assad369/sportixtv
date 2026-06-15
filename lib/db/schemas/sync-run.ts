import type { ObjectId } from "mongodb";

export interface SyncRunCounts {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface SyncRunError {
  stage: string;
  message: string;
  at: Date;
}

/** Resumable cursor so a time-bounded run can continue on the next tick. */
export interface SyncRunCursor {
  competitionIndex: number;
  page: number;
}

/** One sync attempt for one source. The engine writes one doc per source. */
export interface SyncRunDoc {
  _id: ObjectId;
  sourceId: ObjectId | null;
  adapter: string;
  trigger: "cron" | "manual";
  mode: "fixtures" | "live";
  startedAt: Date;
  finishedAt?: Date | null;
  status: "running" | "ok" | "partial" | "error";
  counts: SyncRunCounts;
  /** Capped list (last N) of errors encountered. */
  errors: SyncRunError[];
  /** Set when a run stops early on its time budget; consumed by the next run. */
  cursor?: SyncRunCursor | null;
}

/** Keep error logs from growing unbounded. */
export const MAX_RUN_ERRORS = 20;
