import { upsertEvent } from "@/lib/actions/events";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface EventFormInitial {
  id?: string;
  title: string;
  sport: string;
  league: string;
  teamAName: string;
  teamALogo: string;
  teamBName: string;
  teamBLogo: string;
  /** datetime-local format: YYYY-MM-DDTHH:mm */
  startsAt: string;
  endsAt: string;
  forcedStatus: string;
  channelIds: string[];
  isFeatured: boolean;
}

export function EventForm({
  initial,
  channels,
}: {
  initial: EventFormInitial;
  channels: { id: string; name: string }[];
}) {
  return (
    <form action={upsertEvent} className="flex max-w-3xl flex-col gap-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Title *</label>
          <Input
            name="title"
            defaultValue={initial.title}
            placeholder="Team A vs Team B"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Sport *</label>
          <Input
            name="sport"
            defaultValue={initial.sport}
            placeholder="football / cricket / …"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">League</label>
          <Input name="league" defaultValue={initial.league} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Team A name</label>
          <Input name="teamAName" defaultValue={initial.teamAName} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Team A logo URL</label>
          <Input name="teamALogo" type="url" defaultValue={initial.teamALogo} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Team B name</label>
          <Input name="teamBName" defaultValue={initial.teamBName} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Team B logo URL</label>
          <Input name="teamBLogo" type="url" defaultValue={initial.teamBLogo} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Starts at *</label>
          <Input
            name="startsAt"
            type="datetime-local"
            defaultValue={initial.startsAt}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Ends at <span className="text-ink-faint">(default: start + 4h)</span>
          </label>
          <Input name="endsAt" type="datetime-local" defaultValue={initial.endsAt} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Status override
          </label>
          <Select name="forcedStatus" defaultValue={initial.forcedStatus}>
            <option value="">Automatic (by time)</option>
            <option value="upcoming">Force Upcoming</option>
            <option value="live">Force Live</option>
            <option value="ended">Force Ended</option>
          </Select>
        </div>
      </div>

      <fieldset className="rounded-xl border border-edge p-4">
        <legend className="px-2 text-sm font-semibold">
          Broadcast channels
        </legend>
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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={initial.isFeatured}
          className="size-4 accent-[var(--color-brand)]"
        />
        Featured
      </label>

      <div>
        <Button type="submit" size="lg">
          Save event
        </Button>
      </div>
    </form>
  );
}
