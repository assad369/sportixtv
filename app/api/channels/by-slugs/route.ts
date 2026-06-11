import { z } from "zod";
import { getChannelsBySlugs } from "@/lib/data/channels";

const bodySchema = z.object({
  slugs: z.array(z.string().max(140)).max(100),
});

export async function POST(request: Request) {
  let slugs: string[];
  try {
    slugs = bodySchema.parse(await request.json()).slugs;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const channels = await getChannelsBySlugs(slugs);
  return Response.json({ channels });
}
