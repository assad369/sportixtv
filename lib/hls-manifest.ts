import "server-only";

/**
 * Minimal HLS playlist rewriting.
 *
 * Master playlists: every variant/rendition URI is rewritten to our /play
 * endpoint with a session token, so media-playlist refreshes keep flowing
 * through us.
 * Media playlists: segment/key/map URIs are resolved to absolute origin URLs
 * (segments are intentionally NOT proxied — see plan: manifest-only proxying
 * is the Vercel-feasible compromise).
 */

const URI_ATTR_TAGS = [
  "#EXT-X-MEDIA",
  "#EXT-X-I-FRAME-STREAM-INF",
  "#EXT-X-KEY",
  "#EXT-X-SESSION-KEY",
  "#EXT-X-MAP",
  "#EXT-X-PART",
  "#EXT-X-PRELOAD-HINT",
  "#EXT-X-RENDITION-REPORT",
];

export function isMasterPlaylist(text: string): boolean {
  return text.includes("#EXT-X-STREAM-INF");
}

function resolve(uri: string, baseUrl: string): string {
  try {
    return new URL(uri, baseUrl).toString();
  } catch {
    return uri;
  }
}

function rewriteUriAttr(
  line: string,
  baseUrl: string,
  map: (absUrl: string) => string,
): string {
  return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
    return `URI="${map(resolve(uri, baseUrl))}"`;
  });
}

export function rewriteMasterPlaylist(
  text: string,
  baseUrl: string,
  toSessionUrl: (absUrl: string) => string,
): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        // Alternate renditions (audio/subs) and I-frame variants carry URIs in
        // attributes — they are playlists, so they go through our endpoint too.
        if (
          URI_ATTR_TAGS.some((t) => trimmed.startsWith(t)) &&
          (trimmed.startsWith("#EXT-X-MEDIA") ||
            trimmed.startsWith("#EXT-X-I-FRAME-STREAM-INF"))
        ) {
          return rewriteUriAttr(trimmed, baseUrl, toSessionUrl);
        }
        return line;
      }
      // Plain URI line = variant playlist reference.
      return toSessionUrl(resolve(trimmed, baseUrl));
    })
    .join("\n");
}

export function rewriteMediaPlaylist(text: string, baseUrl: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        // Keys, init segments, parts etc. stay on origin but must be absolute.
        if (URI_ATTR_TAGS.some((t) => trimmed.startsWith(t))) {
          return rewriteUriAttr(trimmed, baseUrl, (abs) => abs);
        }
        return line;
      }
      // Segment URI → absolute origin URL.
      return resolve(trimmed, baseUrl);
    })
    .join("\n");
}

/** Single-variant master wrapper for sources whose URL is a media playlist. */
export function syntheticMaster(sessionUrl: string): string {
  return `#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000\n${sessionUrl}\n`;
}
