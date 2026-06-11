"use client";

import { useState } from "react";
import { upsertChannel } from "@/lib/actions/channels";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { XIcon } from "@/components/icons";

export interface EditableSource {
  label: string;
  url: string;
  referer: string;
  userAgent: string;
  active: boolean;
}

export interface ChannelFormInitial {
  id?: string;
  name: string;
  slug: string;
  logoUrl: string;
  categoryId: string;
  description: string;
  language: string;
  country: string;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  sources: EditableSource[];
}

const EMPTY_SOURCE: EditableSource = {
  label: "",
  url: "",
  referer: "",
  userAgent: "",
  active: true,
};

export function ChannelForm({
  initial,
  categories,
}: {
  initial: ChannelFormInitial;
  categories: { id: string; name: string }[];
}) {
  const [sources, setSources] = useState<EditableSource[]>(
    initial.sources.length > 0
      ? initial.sources
      : [{ ...EMPTY_SOURCE, label: "Server 1" }],
  );
  const [pending, setPending] = useState(false);

  const updateSource = (i: number, patch: Partial<EditableSource>) =>
    setSources((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );

  return (
    <form
      action={upsertChannel}
      onSubmit={() => setPending(true)}
      className="flex max-w-3xl flex-col gap-5"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="sources" value={JSON.stringify(sources)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name *</label>
          <Input name="name" defaultValue={initial.name} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Slug <span className="text-ink-faint">(auto from name if empty)</span>
          </label>
          <Input name="slug" defaultValue={initial.slug} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Logo URL *</label>
          <Input name="logoUrl" type="url" defaultValue={initial.logoUrl} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Category *</label>
          <Select name="categoryId" defaultValue={initial.categoryId} required>
            <option value="" disabled>
              Select category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Language</label>
          <Input name="language" defaultValue={initial.language} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Country</label>
          <Input name="country" defaultValue={initial.country} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Sort order</label>
          <Input name="order" type="number" min={0} defaultValue={initial.order} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <Textarea name="description" rows={3} defaultValue={initial.description} />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial.isActive}
            className="size-4 accent-[var(--color-brand)]"
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={initial.isFeatured}
            className="size-4 accent-[var(--color-brand)]"
          />
          Featured
        </label>
      </div>

      <fieldset className="rounded-xl border border-edge p-4">
        <legend className="px-2 text-sm font-semibold">
          Stream Sources (encrypted at rest)
        </legend>
        <div className="flex flex-col gap-4">
          {sources.map((s, i) => (
            <div
              key={i}
              className="relative rounded-lg border border-edge bg-surface p-3"
            >
              {sources.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove source"
                  onClick={() =>
                    setSources((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute right-2 top-2 text-ink-faint hover:text-live"
                >
                  <XIcon className="size-4" />
                </button>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-ink-muted">
                    Label *
                  </label>
                  <Input
                    value={s.label}
                    onChange={(e) => updateSource(i, { label: e.target.value })}
                    placeholder={`Server ${i + 1}`}
                    required
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={s.active}
                      onChange={(e) =>
                        updateSource(i, { active: e.target.checked })
                      }
                      className="size-4 accent-[var(--color-brand)]"
                    />
                    Active
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-ink-muted">
                    m3u8 URL *
                  </label>
                  <Input
                    value={s.url}
                    onChange={(e) => updateSource(i, { url: e.target.value })}
                    type="url"
                    placeholder="https://example.com/stream/index.m3u8"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-muted">
                    Required Referer (optional)
                  </label>
                  <Input
                    value={s.referer}
                    onChange={(e) =>
                      updateSource(i, { referer: e.target.value })
                    }
                    placeholder="https://origin-site.com/"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-muted">
                    Required User-Agent (optional)
                  </label>
                  <Input
                    value={s.userAgent}
                    onChange={(e) =>
                      updateSource(i, { userAgent: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setSources((prev) => [
                ...prev,
                { ...EMPTY_SOURCE, label: `Server ${prev.length + 1}` },
              ])
            }
          >
            + Add source
          </Button>
        </div>
      </fieldset>

      <div>
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Saving…" : "Save channel"}
        </Button>
      </div>
    </form>
  );
}
