// Edge-safe (imported by proxy.ts) — no "server-only", no node-specific APIs.
export const SESSION_COOKIE = "stv_admin";
/** Non-sensitive hint cookie so the client deterrent script can skip admins. */
export const ROLE_COOKIE = "stv_role";
export const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60;
