import { settings } from "@/lib/db/collections";
import { DEFAULT_SETTINGS } from "@/lib/db/schemas/settings";
import { updateSettings } from "@/lib/actions/settings";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth/session";

export default async function AdminSettingsPage() {
  await requireSession();
  const col = await settings();
  const doc = (await col.findOne({ _id: "site" })) ?? DEFAULT_SETTINGS;

  return (
    <div>
      <h1 className="text-2xl font-bold">Site Settings</h1>

      <form action={updateSettings} className="mt-6 flex max-w-2xl flex-col gap-5">
        <fieldset className="rounded-xl border border-edge p-4">
          <legend className="px-2 text-sm font-semibold">Branding</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Site name *
              </label>
              <Input name="siteName" defaultValue={doc.siteName} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tagline</label>
              <Input name="tagline" defaultValue={doc.tagline} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Logo URL</label>
              <Input name="logoUrl" type="url" defaultValue={doc.logoUrl ?? ""} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Favicon URL
              </label>
              <Input
                name="faviconUrl"
                type="url"
                defaultValue={doc.faviconUrl ?? ""}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-edge p-4">
          <legend className="px-2 text-sm font-semibold">SEO defaults</legend>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                SEO title *
              </label>
              <Input name="seoTitle" defaultValue={doc.seoTitle} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                SEO description *
              </label>
              <Textarea
                name="seoDescription"
                rows={3}
                defaultValue={doc.seoDescription}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Keywords (comma separated)
              </label>
              <Input
                name="seoKeywords"
                defaultValue={doc.seoKeywords.join(", ")}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-edge p-4">
          <legend className="px-2 text-sm font-semibold">Social links</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["facebook", "telegram", "twitter", "youtube"] as const).map(
              (key) => (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium capitalize">
                    {key}
                  </label>
                  <Input
                    name={key}
                    type="url"
                    defaultValue={doc.socialLinks?.[key] ?? ""}
                  />
                </div>
              ),
            )}
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-edge p-4">
          <legend className="px-2 text-sm font-semibold">Ads & features</legend>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                AdSense client ID (ca-pub-…)
              </label>
              <Input
                name="adsenseClientId"
                defaultValue={doc.adsenseClientId ?? ""}
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="adsenseEnabled"
                  defaultChecked={doc.adsenseEnabled}
                  className="size-4 accent-[var(--color-brand)]"
                />
                Enable AdSense
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="tickerEnabled"
                  defaultChecked={doc.tickerEnabled}
                  className="size-4 accent-[var(--color-brand)]"
                />
                Enable notice ticker
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="popunderEnabled"
                  defaultChecked={doc.popunderEnabled}
                  className="size-4 accent-[var(--color-brand)]"
                />
                Enable popunder ads
              </label>
            </div>
          </div>
        </fieldset>

        <div>
          <Button type="submit" size="lg">
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
