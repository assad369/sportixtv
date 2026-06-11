import { searchChannels } from "@/lib/data/channels";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return Response.json({ results: [] });
  }
  const channels = await searchChannels(q);
  return Response.json({
    results: channels.slice(0, 8).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      logoUrl: c.logoUrl,
      description: c.description,
    })),
  });
}
