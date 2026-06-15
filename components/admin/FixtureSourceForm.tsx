import { saveFixtureSource } from "@/lib/actions/fixtures";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface FixtureSourceFormInitial {
  id?: string;
  adapter: string;
  label: string;
  enabled: boolean;
  hasKey: boolean;
  baseUrl: string;
  rateLimitPerMin: string;
  priority: string;
  /** Textarea text: one competition per line `providerLeagueId | label | season`. */
  competitions: string;
}

export function FixtureSourceForm({
  initial,
  adapters,
}: {
  initial: FixtureSourceFormInitial;
  adapters: { id: string; label: string }[];
}) {
  return (
    <form action={saveFixtureSource} className="flex max-w-3xl flex-col gap-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Adapter *</label>
          <Select name="adapter" defaultValue={initial.adapter} required>
            {adapters.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Label *</label>
          <Input
            name="label"
            defaultValue={initial.label}
            placeholder="e.g. Football — primary"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">
            Base URL{" "}
            <span className="text-ink-faint">
              (optional — generic JSON feed / provider override)
            </span>
          </label>
          <Input name="baseUrl" type="url" defaultValue={initial.baseUrl} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">
            API key{" "}
            <span className="text-ink-faint">
              {initial.hasKey
                ? "(key set — leave blank to keep it)"
                : "(stored encrypted; never shown again)"}
            </span>
          </label>
          <Input
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder={initial.hasKey ? "••••••••" : ""}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Rate limit (req/min)
          </label>
          <Input
            name="rateLimitPerMin"
            type="number"
            min={0}
            defaultValue={initial.rateLimitPerMin}
            placeholder="adapter default"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Priority</label>
          <Input
            name="priority"
            type="number"
            min={0}
            defaultValue={initial.priority}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Competitions</label>
        <Textarea
          name="competitions"
          rows={6}
          defaultValue={initial.competitions}
          placeholder={"providerLeagueId | Label | season\n140 | La Liga | 2025"}
        />
        <p className="mt-1 text-xs text-ink-faint">
          One per line: <code>providerLeagueId | label | season</code> (label &
          season optional).
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={initial.enabled}
          className="size-4 accent-[var(--color-brand)]"
        />
        Enabled (included in autopilot runs)
      </label>

      <div>
        <Button type="submit" size="lg">
          Save source
        </Button>
      </div>
    </form>
  );
}
