import { ImageResponse } from "next/og";
import { getEventBySlug } from "@/lib/data/events";
import { getSettings } from "@/lib/data/settings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Watch the match live";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, settings] = await Promise.all([
    getEventBySlug(slug),
    getSettings(),
  ]);

  const title =
    event?.teamA && event?.teamB
      ? `${event.teamA.name}  vs  ${event.teamB.name}`
      : (event?.title ?? settings.siteName);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b0f17 0%, #1e3a8a 100%)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, color: "#93c5fd" }}>
          {event?.league ?? event?.sport ?? "Live Sports"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            marginTop: 24,
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            background: "#ef4444",
            borderRadius: 999,
            padding: "10px 36px",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          WATCH LIVE
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#9ca3af" }}>
          Free on {settings.siteName}
        </div>
      </div>
    ),
    size,
  );
}
