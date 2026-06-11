# SportixTV — Live Sports & TV Streaming Platform

A bdixtv24-style live TV / live sports streaming web app built with
**Next.js 16 (Cache Components / PPR)**, **MongoDB Atlas**, **Tailwind v4**,
and **hls.js**, designed to deploy on **Vercel**.

## Features

- 📺 Channel directory by category, featured & trending rails, instant search
- ⚽ Sports events / EPG-lite: live & upcoming matches, countdowns, team cards
- ▶️ Custom HLS player: quality selector, live-edge, retry, **multi-source
  failover**, Safari native fallback
- 🔐 Stream protection: AES-256-GCM encrypted source URLs at rest, short-lived
  HMAC playback tokens bound to IP+UA, manifest proxying, same-origin
  enforcement in `proxy.ts`
- 🛠 Admin dashboard: channels (multi-source editor), categories, events,
  ad spots, notices ticker, settings, broken-stream reports, view analytics
- 💰 Ads: admin-managed HTML/script & image spots (header, below player,
  sidebar, between grid, footer, popunder) + optional AdSense
- 🔎 SEO: per-page metadata, JSON-LD (WebSite/SearchAction, BroadcastService,
  VideoObject, SportsEvent), dynamic sitemap, robots, generated OG images
- 📱 PWA: installable, offline fallback page, mobile-first dark UI with
  bottom navigation
- 🖱 Right-click / devtools deterrents for visitors (auto-disabled for admins)

## Setup

1. **Install** (pnpm):

   ```bash
   pnpm install
   ```

2. **Environment** — copy `.env.example` to `.env.local` and fill it in
   (secrets were pre-generated if `.env.local` already exists; you only need
   to set `MONGODB_URI`):

   ```bash
   openssl rand -base64 32   # for each secret
   ```

   | Var | Purpose |
   |---|---|
   | `MONGODB_URI` | Atlas connection string |
   | `MONGODB_DB` | DB name (default `sportixtv`) |
   | `SESSION_SECRET` | Admin JWT signing key |
   | `STREAM_TOKEN_SECRET` | Playback token HMAC key (keep separate) |
   | `SOURCE_ENC_KEY` | 32-byte base64 AES key for m3u8 URLs at rest |
   | `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
   | `ADMIN_SEED_EMAIL/PASSWORD` | Used only by the seed script |

3. **Seed** the database (indexes, admin user, default categories, demo
   channels with public test streams):

   ```bash
   pnpm seed
   ```

4. **Run**:

   ```bash
   pnpm dev                   # development
   pnpm build && pnpm start   # production
   ```

   Admin: `/admin/login` with the seeded credentials.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add all env vars from `.env.local` (except the `ADMIN_SEED_*` pair —
   seeding runs locally against Atlas).
3. In Atlas: create the cluster, a DB user, and allow network access from
   `0.0.0.0/0` (Vercel has no fixed egress IPs — rely on strong credentials).
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain and redeploy.

## Stream protection — how it works & honest limits

- m3u8 source URLs are stored AES-256-GCM encrypted and are **never** present
  in any page payload, RSC props, or HTML.
- The player asks `POST /api/stream/token` for a 60-second signed token, then
  loads `/api/stream/play?t=…`. The server fetches the origin manifest and
  rewrites variant playlist URIs to longer-lived (4 h) session tokens that
  embed the **encrypted** target URL, so live refreshes keep flowing through
  the server. Segment URIs are rewritten to absolute origin URLs — segments
  go browser→origin directly (full segment proxying is infeasible on Vercel:
  bandwidth cost and response-size limits).
- All tokens are HMAC-signed and bound to hashed IP + User-Agent;
  `proxy.ts` additionally rejects cross-origin and address-bar requests to
  `/api/stream/*`.

**Limits (by design):** a determined user can still read origin segment URLs
from the rewritten media playlist in DevTools. This layer defeats hotlinking,
embed theft, and casual scraping — not a motivated attacker. The right-click /
devtools blockers are cosmetic deterrents only. In-memory rate limits reset
per serverless instance (upgrade path: Upstash Redis).

## Operational notes

- **Cache invalidation**: all public reads are cached with `'use cache'` +
  tags; every admin save calls `updateTag(...)`, so edits appear on the next
  request without redeploys.
- **AdSense policy risk**: restreamed copyrighted content and popunder ads
  both violate AdSense policies — expect rejection/bans if used that way.
  Custom ad-network spots (HTML type) are the realistic monetization path.
- **Legal**: the operator is responsible for stream licensing; a DMCA page is
  included at `/dmca`.
- The service worker never caches `/api/*` or stream media; live streams do
  not work offline.

## Stack decisions

| Choice | Why |
|---|---|
| MongoDB native driver | Serverless-friendly, no mongoose cold-start weight |
| Hand-rolled jose JWT session | Single admin credentials login; Auth.js v5 unverified on Next 16 |
| Custom hls.js player | Token refresh, failover and retry need the internals players hide |
| Hand-rolled `public/sw.js` | `@serwist/next` depends on webpack; Next 16 builds with Turbopack |
| Tailwind v4 + own `components/ui` | Small bespoke component set; no shadcn dependency tree |
