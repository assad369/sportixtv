import { categories } from "@/lib/db/collections";
import { ChannelForm } from "@/components/admin/ChannelForm";
import { requireSession } from "@/lib/auth/session";

export default async function NewChannelPage() {
  await requireSession();
  const catCol = await categories();
  const cats = await catCol.find({}).sort({ order: 1 }).toArray();

  return (
    <div>
      <h1 className="text-2xl font-bold">New Channel</h1>
      <div className="mt-6">
        <ChannelForm
          categories={cats.map((c) => ({
            id: c._id.toHexString(),
            name: c.name,
          }))}
          initial={{
            name: "",
            slug: "",
            logoUrl: "",
            categoryId: "",
            description: "",
            language: "",
            country: "",
            isActive: true,
            isFeatured: false,
            order: 0,
            sources: [],
          }}
        />
      </div>
    </div>
  );
}
