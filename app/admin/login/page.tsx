"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TvIcon } from "@/components/icons";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-edge bg-surface p-8">
        <div className="flex flex-col items-center gap-2">
          <span className="grid size-12 place-items-center rounded-xl bg-brand text-white">
            <TvIcon className="size-7" />
          </span>
          <h1 className="text-xl font-bold">Admin Login</h1>
          <p className="text-sm text-ink-faint">Sign in to manage the site</p>
        </div>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state.error && (
            <p className="rounded-lg bg-live/10 px-3 py-2 text-sm text-live">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
