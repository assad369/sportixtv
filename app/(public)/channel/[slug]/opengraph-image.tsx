import { ImageResponse } from "next/og";
import { getChannelBySlug } from "@/lib/data/channels";
import { getSettings } from "@/lib/data/settings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Watch live";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [channel, settings] = await Promise.all([
    getChannelBySlug(slug),
    getSettings(),
  ]);

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
          background: "linear-gradient(135deg, #0b0f17 0%, #14532d 100%)",
          color: "#fff",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        {channel?.logoUrl && (
          <img
            src={channel.logoUrl}
            alt=""
            width={160}
            height={160}
            style={{ borderRadius: 24, marginBottom: 32 }}
          />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              background: "#ef4444",
              borderRadius: 999,
              padding: "8px 28px",
              fontSize: 32,
            }}
          >
            LIVE
          </div>
          <div style={{ display: "flex" }}>
            {channel?.name ?? settings.siteName}
          </div>
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: "#9ca3af" }}>
          Watch free on {settings.siteName}
        </div>
      </div>
    ),
    size,
  );
}
