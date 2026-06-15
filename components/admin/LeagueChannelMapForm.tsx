import { saveLeagueChannelMap } from "@/lib/actions/fixtures";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface LeagueChannelMapFormInitial {
  id?: string;
  sport: string;
  league: string;
  providerLeagueId: string;
  source: string;
  channelIds: string[];
  priority: string;
  enabled: boolean;
}

export function LeagueChannelMapForm({
  initial,
  channels,
}: {
  initial: LeagueChannelMapFormInitial;
  channels: { id: string; name: string }[];
}) {
  return (
    <form
      action={saveLeagueChannelMap}
      className="flex max-w-3xl flex-col gap-5"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <fieldset className="rounded-xl border border-edge p-4">
        <legend className="px-2 text-sm font-semibold">
          Match rule (most specific wins)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Sport</label>
            <Input
              name="sport"
              defaultValue={initial.sport}
              placeholder="football / cricket"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">League</label>
            <Input
              name="league"
              defaultValue={initial.league}
              placeholder="La Liga"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Provider league id
            </label>
            <Input
              name="providerLeagueId"
              defaultValue={initial.providerLeagueId}
              placeholder="140"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Source (adapter id)
            </label>
            <Input
              name="source"
              defaultValue={initial.source}
              placeholder="reference / api-football"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          providerLeagueId + source is most specific, then league, then sport as
          a fallback.
        </p>
      </fieldset>

      <fieldset className="rounded-xl border border-edge p-4">
        <legend className="px-2 text-sm font-semibold">Assign channels *</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {channels.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="channelIds"
                value={c.id}
                defaultChecked={initial.channelIds.includes(c.id)}
                className="size-4 accent-[var(--color-brand)]"
              />
              {c.name}
            </label>
          ))}
          {channels.length === 0 && (
            <p className="text-sm text-ink-faint">
              No channels yet — create channels first.
            </p>
          )}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={initial.enabled}
          className="size-4 accent-[var(--color-brand)]"
        />
        Enabled
      </label>

      <div>
        <Button type="submit" size="lg">
          Save mapping
        </Button>
      </div>
    </form>
  );
}
