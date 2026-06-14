import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { channels, categories } from "@/lib/db/collections";
import { decryptSecret } from "@/lib/crypto";
import { ChannelForm } from "@/components/admin/ChannelForm";
import { requireSession } from "@/lib/auth/session";

export default async function EditChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const [chCol, catCol] = await Promise.all([channels(), categories()]);
  const [channel, cats] = await Promise.all([
    chCol.findOne({ _id: new ObjectId(id) }),
    catCol.find({}).sort({ order: 1 }).toArray(),
  ]);
  if (!channel) notFound();

  // Decrypted only here, inside the session-gated, never-cached admin tree.
  const sources = channel.sources.map((s) => ({
    type: s.type ?? "hls",
    label: s.label,
    url: s.urlEnc ? decryptSecret(s.urlEnc) : "",
    referer: s.refererEnc ? decryptSecret(s.refererEnc) : "",
    userAgent: s.userAgentEnc ? decryptSecret(s.userAgentEnc) : "",
    iframeCode: s.iframeCodeEnc ? decryptSecret(s.iframeCodeEnc) : "",
    active: s.active,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit Channel</h1>
      <div className="mt-6">
        <ChannelForm
          categories={cats.map((c) => ({
            id: c._id.toHexString(),
            name: c.name,
          }))}
          initial={{
            id,
            name: channel.name,
            slug: channel.slug,
            logoUrl: channel.logoUrl,
            categoryId: channel.categoryId.toHexString(),
            description: channel.description ?? "",
            language: channel.language ?? "",
            country: channel.country ?? "",
            isActive: channel.isActive,
            isFeatured: channel.isFeatured,
            order: channel.order,
            sources,
          }}
        />
      </div>
    </div>
  );
}
