import "server-only";

/**
 * Run a DB read, returning a fallback when MONGODB_URI isn't configured yet
 * (lets the app build and render its shell before the database is set up).
 * Real query errors with a configured URI still throw.
 */
export async function safeQuery<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not set — returning empty data");
    return fallback;
  }
  return fn();
}
