import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { ArrowLeft, Check, ExternalLink, FileText, Minus, RefreshCw, X } from "lucide-react";
import { moveStage, rerunMatch } from "@/app/actions/recruiter";
import { getRole } from "@/data/roles";
import { MatchRing } from "@/components/match-ring";
import { SubmitButton } from "@/components/submit-button";
import { getDb, schema } from "@/lib/db";
import { stages } from "@/lib/db/schema";
import { formatWhen } from "@/lib/format";
import type { Verdict } from "@/lib/match/types";
import { stageInfo } from "@/lib/stages";

export const dynamic = "force-dynamic";

const verdictStyle: Record<Verdict, { icon: typeof Check; label: string; className: string }> = {
  met: { icon: Check, label: "Met", className: "bg-primary text-white" },
  partial: { icon: Minus, label: "Partly", className: "bg-tertiary-fixed text-on-tertiary-fixed" },
  missing: { icon: X, label: "Not shown", className: "bg-surface-container-high text-on-surface-variant" },
};

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();

  const db = await getDb();
  let application = await db.query.applications.findFirst({ where: eq(schema.applications.id, id.data) });
  if (!application) notFound();

  // Opening an application is the first review: the candidate's tracker shows it.
  if (application.stage === "applied") {
    const [updated] = await db
      .update(schema.applications)
      .set({ stage: "in_review", updatedAt: new Date() })
      .where(eq(schema.applications.id, application.id))
      .returning();
    await db.insert(schema.events).values({ applicationId: application.id, stage: "in_review", actor: "system", note: null });
    application = updated;
  }

  const [resume, history] = await Promise.all([
    db.query.resumes.findFirst({
      where: eq(schema.resumes.id, application.resumeId),
      columns: { id: true, fileName: true, parsed: true, parsedBy: true, sizeBytes: true },
    }),
    db.select().from(schema.events).where(eq(schema.events.applicationId, application.id)).orderBy(asc(schema.events.createdAt)),
  ]);
  const role = getRole(application.roleSlug);
  const match = application.match;

  const links = [
    ["LinkedIn", application.linkedin],
    ["GitHub", application.github],
    ["Portfolio", application.portfolio],
  ].filter(([, url]) => url) as [string, string][];

  return (
    <div className="space-y-6">
      <Link href="/recruiter" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
        <ArrowLeft size={16} aria-hidden /> Back to the board
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          {/* Who */}
          <section className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-on-surface-variant">{role?.title ?? application.roleSlug}</p>
                <h2 className="display mt-1 text-3xl sm:text-4xl">{application.name}</h2>
                {resume?.parsed.headline && <p className="mt-2 text-on-surface-variant">{resume.parsed.headline}</p>}
              </div>
              <span className="chip bg-primary-fixed/60 px-4 py-1.5 text-sm text-primary">{stageInfo[application.stage].label}</span>
            </div>
            <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Detail label="Email" value={<a className="text-primary hover:underline" href={`mailto:${application.email}`}>{application.email}</a>} />
              <Detail label="Phone" value={<a className="text-primary hover:underline" href={`tel:${application.phone.replace(/\s/g, "")}`}>{application.phone}</a>} />
              <Detail
                label="WhatsApp"
                value={
                  application.whatsapp ? (
                    <a className="text-primary hover:underline" href={`https://wa.me/${application.whatsapp.replace(/\D/g, "")}`}>
                      {application.whatsapp}
                    </a>
                  ) : (
                    "Not given"
                  )
                }
              />
              <Detail label="Applied" value={formatWhen(application.createdAt)} />
              {application.graduationYear && <Detail label="Graduation year" value={application.graduationYear} />}
              {resume && resume.parsed.education[0]?.institution && <Detail label="Education" value={resume.parsed.education[0].institution} />}
            </dl>
            {links.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {links.map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-ghost min-h-9 px-4 text-sm">
                    {label} <ExternalLink size={14} aria-hidden />
                  </a>
                ))}
              </div>
            )}
            {application.note && (
              <blockquote className="mt-6 rounded-2xl bg-surface-container-low p-4 leading-relaxed text-on-surface-variant">
                &ldquo;{application.note}&rdquo;
              </blockquote>
            )}
          </section>

          {/* Match against the role's own requirements */}
          <section className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-display text-2xl font-bold">Match with the role&apos;s requirements</h3>
              <form action={rerunMatch}>
                <input type="hidden" name="id" value={application.id} />
                <SubmitButton className="btn btn-ghost min-h-9 px-4 text-sm" pendingText="Checking…">
                  <RefreshCw size={14} aria-hidden /> Re-check
                </SubmitButton>
              </form>
            </div>
            {match ? (
              <>
                <div className="mt-5 flex items-center gap-5">
                  <MatchRing score={match.score} size={84} stroke={8} />
                  <div>
                    <p className="leading-relaxed">{match.summary}</p>
                    <p className="mt-1 text-xs text-outline">
                      {match.engine === "gemini" ? "Read by AI, every quote checked against the résumé" : "Keyword rules (AI unavailable)"} ·{" "}
                      {formatWhen(match.computedAt)}
                    </p>
                  </div>
                </div>
                <ul className="mt-6 divide-y divide-surface-container">
                  {match.checks.map((check) => {
                    const style = verdictStyle[check.verdict];
                    const Icon = style.icon;
                    return (
                      <li key={check.requirement} className="flex gap-3 py-3.5">
                        <span className={`chip h-fit shrink-0 px-2.5 ${style.className}`}>
                          <Icon size={12} aria-hidden /> {style.label}
                        </span>
                        <div>
                          <p className="font-semibold leading-snug">{check.requirement}</p>
                          {check.evidence && <p className="mt-1 text-sm text-on-surface-variant">&ldquo;{check.evidence}&rdquo;</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
                  The score only counts the role&apos;s listed requirements (met = 1, partly = ½). It ignores name, gender, age and
                  college. It helps you read faster; it doesn&apos;t decide.
                </p>
              </>
            ) : (
              <p className="mt-4 text-on-surface-variant">The match is still being calculated. Refresh in a few seconds.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {/* Move forward */}
          <section className="card p-6">
            <h3 className="font-display text-lg font-bold">Move this application</h3>
            <form action={moveStage} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={application.id} />
              <label htmlFor="stage" className="sr-only">
                Stage
              </label>
              <select id="stage" name="stage" defaultValue={application.stage} className="field">
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stageInfo[stage].label}
                  </option>
                ))}
              </select>
              <label htmlFor="note" className="block text-sm font-bold">
                Message to the candidate <span className="font-medium text-outline">(optional, shown on their tracker)</span>
              </label>
              <textarea id="note" name="note" rows={3} maxLength={500} className="field" placeholder="e.g. Interview invite sent to your email for Tue 11 AM." />
              <SubmitButton className="btn btn-primary w-full" pendingText="Saving…">
                Update stage
              </SubmitButton>
            </form>
          </section>

          {resume && (
            <section className="card p-6">
              <h3 className="font-display text-lg font-bold">Résumé</h3>
              <a href={`/api/resumes/${resume.id}`} target="_blank" className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-container-low p-3 hover:bg-surface-container">
                <FileText className="shrink-0 text-primary" size={22} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{resume.fileName}</span>
                  <span className="text-xs text-outline">{Math.round(resume.sizeBytes / 1024)} KB · open PDF</span>
                </span>
              </a>
              {resume.parsed.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {resume.parsed.skills.map((skill) => (
                    <span key={skill} className="chip bg-surface-container text-on-surface-variant">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="card p-6">
            <h3 className="font-display text-lg font-bold">History</h3>
            <ol className="mt-3 space-y-3 text-sm">
              {history.map((event) => (
                <li key={event.id}>
                  <p>
                    <span className="font-semibold">{stageInfo[event.stage].label}</span>{" "}
                    <span className="text-outline">· {event.actor === "system" ? "opened" : event.actor}</span>
                  </p>
                  <p className="text-xs text-outline">{formatWhen(event.createdAt)}</p>
                  {event.note && <p className="mt-1 text-on-surface-variant">{event.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-outline">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
