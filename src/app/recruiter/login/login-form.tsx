"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/app/actions/recruiter";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
        />
        {state.error && (
          <p id="password-error" className="mt-1.5 text-sm font-semibold text-error" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" size={18} aria-hidden /> : null}
        Sign in
      </button>
    </form>
  );
}
