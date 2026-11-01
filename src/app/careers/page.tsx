import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ArrowDown, Check } from "lucide-react";
import { getRole, roleCounts, roles, teams } from "@/data/roles";
import { MatchRing } from "@/components/match-ring";
import { ResumeMatcher } from "@/components/resume-matcher";
import { RoleBrowser } from "@/components/role-browser";
import { matchWithRules } from "@/lib/match/rules";
import { findSkills } from "@/lib/skills";

export const metadata: Metadata = {
  title: { absolute: "Careers at Cynbit: open roles in Jaipur and remote" },
  description: `${roleCounts.total} open roles at Cynbit Technologies: ${roleCounts.internships} internships and ${roleCounts.fullTime} full-time. Upload your résumé to see which fit you, then apply in about a minute.`,
  alternates: { canonical: "/careers" },
};

// The text behind the example card in the hero, scored by the same rules a real upload uses.
const demoResume = "Priya Sharma priya@example.com B.Tech CSE 2027 React, Next.js, Node.js, PostgreSQL, Git. Built REST APIs.";
const demoRole = getRole("full-stack-developer-intern")!;
const demoScore = matchWithRules(demoRole, demoResume, findSkills(demoResume)).score;

const howSteps = [
  { title: "Apply in about a minute", body: "Upload your PDF. Your details fill in; you check them and send. Five required fields instead of twenty-one." },
  { title: "Reviewed within 48 hours", body: "Cynbit's own promise, now visible: your tracker shows when someone opens your application." },
  { title: "Interview", body: "If it's a fit, you hear about next steps on email or WhatsApp, and the tracker moves too." },
  { title: "A clear decision", body: "Yes or no, you find out. Nobody is left wondering whether the form went through." },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero: the signature element lives on the right */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pt-16">
        <div>
          <p className="chip bg-tertiary-fixed text-on-tertiary-fixed">Cynbit careers · Remote or Jaipur</p>
          <h1 className="display mt-5 text-[2.6rem] sm:text-6xl lg:text-[4.25rem]">
            Your résumé already <em>knows</em> where you fit.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-on-surface-variant">
            Drop it in. We read it, show the Cynbit roles that match and why, and fill the application for you. You check
            it and press send.
          </p>
          <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4">
            {[
              [roleCounts.total, "open roles"],
              [roleCounts.internships, "internships"],
              [roleCounts.fullTime, "full-time"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block font-display text-4xl font-extrabold text-primary sm:text-5xl">{value}</span>
                  <span className="text-sm font-semibold text-on-surface-variant">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <label htmlFor="hero-resume" className="btn btn-primary cursor-pointer">
              Upload your résumé (PDF)
            </label>
            <a href="#roles" className="btn btn-ghost">
              Browse all {roleCounts.total} roles <ArrowDown size={16} aria-hidden />
            </a>
          </div>
        </div>
        <ResumeMatcher demoScore={demoScore} demoRole={demoRole.title} />
      </section>

      {/* Roles come right after the hero: candidates shouldn't scroll five screens to find them */}
      <section id="roles" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-4xl sm:text-5xl">
            Open <em>roles</em>
          </h2>
          <p className="max-w-md text-on-surface-variant">
            Every role is open to remote candidates or in Jaipur. Pick one to see the full description and apply.
          </p>
        </div>
        <RoleBrowser roles={roles.map(({ responsibilities: _r, requirements: _q, benefits: _b, sourceUrl: _s, ...card }) => card)} teams={teams} />
      </section>

      {/* How hiring works: the tracker turns the 48-hour promise into something visible */}
      <section id="how" className="glow grain on-ink curve-top scroll-mt-16 bg-ink text-on-ink">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div>
            <p className="eyebrow text-primary-fixed-dim" data-reveal>
              How hiring works
            </p>
            <h2 className="display mt-4 text-4xl sm:text-6xl" data-reveal>
              Know where you stand. <em>Always.</em>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-on-ink-muted" data-reveal>
              Every application gets a private tracker link. When the team moves you forward, you see it there, with the
              date.
            </p>
            <ol className="mt-10 space-y-6">
              {howSteps.map((step, index) => (
                <li key={step.title} className="flex gap-4" data-reveal style={{ "--reveal-i": index } as CSSProperties}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-fixed font-display font-extrabold text-ink">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold">{step.title}</p>
                    <p className="mt-1 leading-relaxed text-on-ink-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:pt-16" data-reveal>
            <div className="rounded-[2rem] bg-white p-6 text-on-surface shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">Example tracker</p>
              <div className="mt-3 flex items-center gap-4">
                <MatchRing score={60} size={52} label="Progress: 3 of 5 steps" />
                <div>
                  <p className="font-display text-xl font-bold">Full Stack Developer Intern</p>
                  <p className="text-sm text-on-surface-variant">Applied 2 Nov, 10:14 AM</p>
                </div>
              </div>
              <ol className="mt-6 space-y-0">
                {[
                  ["Applied", "2 Nov, 10:14 AM", true],
                  ["In review", "2 Nov, 4:30 PM", true],
                  ["Shortlisted", "3 Nov, 11:02 AM", true],
                  ["Interview", "Next", false],
                  ["Decision", "", false],
                ].map(([label, when, done], index, list) => (
                  <li key={String(label)} className="relative flex gap-4 pb-5 last:pb-0">
                    {index < list.length - 1 && (
                      <span className={`absolute left-[11px] top-6 h-full w-0.5 ${done ? "bg-primary" : "bg-surface-container-high"}`} aria-hidden />
                    )}
                    <span className={`relative grid size-6 shrink-0 place-items-center rounded-full ${done ? "bg-primary text-white" : "border-2 border-outline-variant bg-white"}`}>
                      {done ? <Check size={14} aria-hidden /> : null}
                    </span>
                    <div className="flex flex-1 justify-between gap-3">
                      <span className={`font-semibold ${done ? "" : "text-outline"}`}>{label}</span>
                      <span className="text-sm text-outline">{when}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-4 text-center text-sm text-on-ink-muted">An example. Yours appears the moment you apply.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card flex flex-col items-start justify-between gap-6 p-8 sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className="display text-3xl sm:text-4xl">
              Don&apos;t see your <em>role?</em>
            </h2>
            <p className="mt-3 max-w-xl text-on-surface-variant">
              Upload your résumé at the top and we&apos;ll show the closest roles, or write to the team with what you&apos;d
              like to work on.
            </p>
          </div>
          <a href="mailto:opportunities@cynbit.in?subject=General%20application" className="btn btn-ghost shrink-0">
            Email opportunities@cynbit.in
          </a>
        </div>
      </section>
    </>
  );
}
