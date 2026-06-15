import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getFixtureSource } from "@/lib/data/fixtures";
import { listAdapters } from "@/lib/sync/adapters";
import { FixtureSourceForm } from "@/components/admin/FixtureSourceForm";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const source = await getFixtureSource(id);
  if (!source) notFound();

  const adapters = listAdapters().map((a) => ({ id: a.id, label: a.label }));
  const competitions = source.competitions
    .map((c) =>
      [c.providerLeagueId, c.label, c.season].filter(Boolean).join(" | "),
    )
    .join("\n");

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit Source</h1>
      <div className="mt-6">
        <FixtureSourceForm
          adapters={adapters}
          initial={{
            id: source.id,
            adapter: source.adapter,
            label: source.label,
            enabled: source.enabled,
            hasKey: source.hasKey,
            baseUrl: source.baseUrl ?? "",
            rateLimitPerMin:
              source.rateLimitPerMin != null
                ? String(source.rateLimitPerMin)
                : "",
            priority: String(source.priority),
            competitions,
          }}
        />
      </div>
    </div>
  );
}
