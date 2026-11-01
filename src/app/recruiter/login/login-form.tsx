"use client";

import { useActionState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/app/actions/recruiter";

export function LoginForm({ next, demoPassword }: { next: string; demoPassword?: string }) {
  const [state, action, pending] = useActionState(login, {});
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <form action={action} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-bold">
            Password
          </label>
          <input
            ref={inputRef}
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

      {demoPassword && (
        <div className="mt-6 rounded-2xl bg-tertiary-fixed px-4 py-3 text-sm text-on-tertiary-fixed">
          <p>
            Reviewing this prototype? The demo password is{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 font-bold">{demoPassword}</code>
          </p>
          <button
            type="button"
            className="mt-2 font-bold underline underline-offset-2"
            onClick={() => {
              if (!inputRef.current) return;
              inputRef.current.value = demoPassword;
              inputRef.current.focus();
            }}
          >
            Fill it in
          </button>
        </div>
      )}
    </>
  );
}
