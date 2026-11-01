import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Bot, Database, FileText, ShieldCheck, UserCheck } from "lucide-react";
import { comparisons, lighthouse, measuredOn, nextFixes } from "@/data/evidence";

export const metadata: Metadata = {
  title: "What changed and why",
  description: "How this prototype rebuilds Cynbit's careers flow: the problems found on cynbit.in, what changed, and how the résumé matching stays honest.",
  alternates: { canonical: "/about" },
};

const flow = [
  { icon: FileText, title: "PDF in", body: "Checked by its bytes, capped at 3 MB, text pulled out with unpdf." },
  { icon: Bot, title: "Read", body: "Gemini returns structured fields; contact details must appear in the PDF or they're dropped." },
  { icon: Database, title: "Stored", body: "Postgres (Neon). The résumé is saved once and reused when you apply." },
  { icon: UserCheck, title: "Matched", body: "Each requirement gets met / partly / not shown with a quote. The score is computed in code." },
];

const guardrails = [
  "A quote that isn't in the résumé downgrades the verdict.",
  "Name, gender, age, college and location are excluded from matching.",
  "Instructions hidden inside a résumé are ignored.",
  "Rule-based fallback if the model is slow, down or wrong.",
  "A person moves every stage; nothing is auto-rejected.",
  "Résumé PDFs are only served to a signed-in recruiter.",
];

export default function AboutPage() {
  const after = lighthouse.after;
  const bigNumbers = [
    { before: "21", after: "5", label: "required inputs to apply" },
    { before: "0", after: "20", label: "roles with Google for Jobs data" },
    { before: String(lighthouse.before.mobile), after: after.mobile ? String(after.mobile) : "…", label: "Lighthouse mobile, /careers" },
  ];

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:pt-20">
        <p className="eyebrow text-primary">What changed and why</p>
        <h1 className="display mt-4 max-w-4xl text-5xl sm:text-7xl">
          One area, done <em>properly.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
          I went through cynbit.in as a candidate and as a developer and picked hiring: the flow Cynbit&apos;s team uses every
          day, and the one hundreds of applicants judge Cynbit by. Everything below was measured on {measuredOn}.
        </p>

        <dl className="mt-12 grid gap-4 sm:grid-cols-3">
          {bigNumbers.map((item, index) => (
            <div key={item.label} className="card p-6" data-reveal style={{ "--reveal-i": index } as CSSProperties}>
              <dt className="text-sm font-semibold text-on-surface-variant">{item.label}</dt>
              <dd className="mt-2 flex items-baseline gap-3 font-display font-extrabold">
                <span className="text-3xl text-outline line-through decoration-2">{item.before}</span>
                <ArrowRight size={22} className="text-outline" aria-label="to" />
                <span className="text-6xl text-primary">{item.after}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="display text-4xl sm:text-5xl" data-reveal>
          Before and <em>after</em>
        </h2>
        <div className="mt-8 overflow-x-auto rounded-[2rem] bg-white shadow-[var(--shadow-soft)]" data-reveal>
          <table className="w-full min-w-[40rem] text-left text-sm sm:text-base">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-outline">
              <tr>
                <th scope="col" className="px-5 py-4 sm:px-7">What</th>
                <th scope="col" className="px-5 py-4">cynbit.in today</th>
                <th scope="col" className="px-5 py-4 sm:px-7">This prototype</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {comparisons.map((row) => (
                <tr key={row.label} className="align-top">
                  <th scope="row" className="px-5 py-4 font-display font-bold sm:px-7">{row.label}</th>
                  <td className="px-5 py-4 text-on-surface-variant">{row.before}</td>
                  <td className="px-5 py-4 font-semibold text-primary sm:px-7">{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glow grain on-ink curve-top bg-ink text-on-ink">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <p className="eyebrow text-primary-fixed-dim" data-reveal>Under the hood</p>
          <h2 className="display mt-4 max-w-3xl text-4xl sm:text-6xl" data-reveal>
            AI reads. Code scores. <em>People decide.</em>
          </h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-4">
            {flow.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="rounded-[1.75rem] bg-white/[0.06] p-6 ring-1 ring-white/10" data-reveal style={{ "--reveal-i": index } as CSSProperties}>
                <span className="grid size-11 place-items-center rounded-full bg-primary-fixed text-ink">
                  <Icon size={20} aria-hidden />
                </span>
                <p className="mt-4 font-display text-xl font-bold">
                  {index + 1}. {title}
                </p>
                <p className="mt-2 leading-relaxed text-on-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {guardrails.map((rule) => (
              <li key={rule} className="flex gap-3 text-on-ink-muted" data-reveal>
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary-fixed-dim" aria-hidden />
                {rule}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-on-ink-muted">
            Stack: Next.js 15.5 App Router and Server Actions, Tailwind v4 with Cynbit&apos;s own tokens, Drizzle + Postgres (Neon),
            unpdf, Gemini. The same framework version as cynbit.in, so this can be merged rather than rewritten.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="display text-4xl sm:text-5xl" data-reveal>
          What I&apos;d fix <em>next</em>
        </h2>
        <p className="mt-4 max-w-2xl text-on-surface-variant" data-reveal>
          Outside this scope, but found during the audit, with the evidence:
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {nextFixes.map((fix, index) => (
            <div key={fix.title} className="card p-6 sm:p-8" data-reveal style={{ "--reveal-i": index } as CSSProperties}>
              <p className="font-display text-xl font-bold">{fix.title}</p>
              <p className="mt-2 leading-relaxed text-on-surface-variant">{fix.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/careers" className="btn btn-primary">
            Try the careers page
          </Link>
          <Link href="/recruiter" className="btn btn-ghost">
            Open the recruiter view
          </Link>
          <a href="https://github.com/aayush-t-exe/cynbit-careers" className="btn btn-ghost">
            Code on GitHub
          </a>
        </div>
      </section>
    </>
  );
}
