import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/constants";

function streamGuard(request: NextRequest): NextResponse | null {
  const host = request.nextUrl.host;

  // Browser-provided fetch metadata: same-origin requests from our player set
  // sec-fetch-site=same-origin. Pasting the play URL into the address bar
  // arrives as "none" — block it.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Origin/Referer, when present, must match our host (defense in depth for
  // older browsers / extensions; absence is allowed — the HMAC token is the
  // real gate).
  for (const header of ["origin", "referer"] as const) {
    const value = request.headers.get(header);
    if (!value) continue;
    try {
      if (new URL(value).host !== host) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return null;
}

async function adminGuard(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return null;

  // Optimistic check only — the dashboard layout and every Server Action
  // re-verify. This just keeps anonymous traffic off the admin tree.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && process.env.SESSION_SECRET) {
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.SESSION_SECRET),
      );
      return null;
    } catch {
      // fall through to redirect
    }
  }
  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/stream/")) {
    return streamGuard(request) ?? NextResponse.next();
  }
  if (pathname.startsWith("/admin")) {
    return (await adminGuard(request)) ?? NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/stream/:path*", "/admin/:path*"],
};
