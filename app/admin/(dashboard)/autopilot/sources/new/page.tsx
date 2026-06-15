import { requireSession } from "@/lib/auth/session";
import { listAdapters } from "@/lib/sync/adapters";
import { FixtureSourceForm } from "@/components/admin/FixtureSourceForm";

export default async function NewSourcePage() {
  await requireSession();
  const adapters = listAdapters().map((a) => ({ id: a.id, label: a.label }));

  return (
    <div>
      <h1 className="text-2xl font-bold">New Source</h1>
      <div className="mt-6">
        <FixtureSourceForm
          adapters={adapters}
          initial={{
            adapter: adapters[0]?.id ?? "",
            label: "",
            enabled: true,
            hasKey: false,
            baseUrl: "",
            rateLimitPerMin: "",
            priority: "0",
            competitions: "",
          }}
        />
      </div>
    </div>
  );
}
