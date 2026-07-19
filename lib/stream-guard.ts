// Anti-hotlink check for /api/stream/* endpoints. Used to live in proxy.ts,
// but Next 16 Proxy always runs on Node.js and Cloudflare Workers (via
// OpenNext) doesn't support Node.js Proxy yet — so each stream route calls
// this directly instead.
export function streamGuard(request: Request): Response | null {
  const host = new URL(request.url).host;

  // Browser-provided fetch metadata: same-origin requests from our player set
  // sec-fetch-site=same-origin. Pasting the play URL into the address bar
  // arrives as "none" — block it.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Origin/Referer, when present, must match our host (defense in depth for
  // older browsers / extensions; absence is allowed — the HMAC token is the
  // real gate).
  for (const header of ["origin", "referer"] as const) {
    const value = request.headers.get(header);
    if (!value) continue;
    try {
      if (new URL(value).host !== host) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return null;
}
