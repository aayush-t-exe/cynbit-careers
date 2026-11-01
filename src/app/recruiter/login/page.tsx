import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Recruiter sign-in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl place-items-center px-4 py-16">
      <div className="card w-full max-w-md p-8">
        <p className="eyebrow text-primary">Recruiter view</p>
        <h1 className="display mt-3 text-4xl">
          Every applicant, <em>one board.</em>
        </h1>
        <p className="mt-3 text-on-surface-variant">
          Sign in to see applications by stage, résumé matches against each role&apos;s requirements, and to move candidates
          forward.
        </p>
        <LoginForm next={next ?? "/recruiter"} />
        <p className="mt-6 rounded-2xl bg-tertiary-fixed px-4 py-3 text-sm text-on-tertiary-fixed">
          Reviewing this prototype? The password is in the submission notes.
        </p>
      </div>
    </div>
  );
}
