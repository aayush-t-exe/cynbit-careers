import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { AlarmClock } from "lucide-react";
import { getRole, roles } from "@/data/roles";
import { getDb, schema } from "@/lib/db";
import { stages, type Stage } from "@/lib/db/schema";
import { stageInfo } from "@/lib/stages";
import { ago, hoursSince } from "@/lib/format";
import { ScorePill } from "@/components/score-pill";
import { SubmitButton } from "@/components/submit-button";
import { reloadSamples } from "@/app/actions/recruiter";

export const dynamic = "force-dynamic";
// Reloading the sample candidates calls the model for each of them.
export const maxDuration = 60;

const REVIEW_PROMISE_HOURS = 48;

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role: roleFilter } = await searchParams;
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.applications.id,
      name: schema.applications.name,
      roleSlug: schema.applications.roleSlug,
      stage: schema.applications.stage,
      match: schema.applications.match,
      isSample: schema.applications.isSample,
      createdAt: schema.applications.createdAt,
    })
    .from(schema.applications)
    .where(roleFilter ? eq(schema.applications.roleSlug, roleFilter) : undefined)
    .orderBy(desc(schema.applications.createdAt));

  const waiting = rows.filter((row) => row.stage === "applied");
  const overdue = waiting.filter((row) => hoursSince(row.createdAt) > REVIEW_PROMISE_HOURS);
  const scored = rows.filter((row) => row.match);
  const averageMatch = scored.length ? Math.round(scored.reduce((sum, row) => sum + row.match!.score, 0) / scored.length) : null;

  const byStage = new Map<Stage, typeof rows>(stages.map((stage) => [stage, []]));
  for (const row of rows) byStage.get(row.stage)?.push(row);
  for (const list of byStage.values()) list.sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1));

  const appliedRoles = roles.filter((role) => rows.some((row) => row.roleSlug === role.slug) || role.slug === roleFilter);

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Applications" value={rows.length} />
        <Stat label="Waiting for first review" value={waiting.length} />
        <Stat label={`Past the ${REVIEW_PROMISE_HOURS}-hour promise`} value={overdue.length} warn={overdue.length > 0} />
        <Stat label="Average match" value={averageMatch === null ? "–" : `${averageMatch}%`} />
      </dl>

      <form className="flex flex-wrap items-center gap-3" action="/recruiter">
        <label htmlFor="role" className="text-sm font-bold">
          Role
        </label>
        <select id="role" name="role" defaultValue={roleFilter ?? ""} className="field min-h-10 w-auto rounded-full py-1.5">
          <option value="">All roles ({roles.length})</option>
          {(appliedRoles.length ? appliedRoles : roles).map((role) => (
            <option key={role.slug} value={role.slug}>
              {role.title}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-ghost min-h-10 px-4 text-sm">
          Filter
        </button>
        {roleFilter && (
          <Link href="/recruiter" className="text-sm font-semibold text-primary hover:underline">
            Clear
          </Link>
        )}
      </form>
      <form action={reloadSamples} className="-mt-4 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
        <span>Cards tagged &ldquo;sample&rdquo; are fictional demo candidates.</span>
        <SubmitButton className="font-semibold text-primary hover:underline" pendingText="Reloading samples…">
          Reload sample candidates
        </SubmitButton>
      </form>

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-xl font-bold">No applications yet.</p>
          <p className="mt-2 text-on-surface-variant">
            Apply to any role from the <Link href="/careers" className="font-semibold text-primary underline">careers page</Link> and it appears here.
          </p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          <div className="grid min-w-[72rem] grid-cols-6 gap-3">
            {stages.map((stage) => (
              <section key={stage} aria-label={stageInfo[stage].label} className="rounded-[1.75rem] bg-surface-container-low p-3">
                <h2 className="flex items-center justify-between px-2 pb-3 pt-1 font-display text-sm font-bold">
                  {stageInfo[stage].label}
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-on-surface-variant">{byStage.get(stage)!.length}</span>
                </h2>
                <ul className="space-y-2.5">
                  {byStage.get(stage)!.map((row) => {
                    const late = row.stage === "applied" && hoursSince(row.createdAt) > REVIEW_PROMISE_HOURS;
                    return (
                      <li key={row.id}>
                        <Link
                          href={`/recruiter/applications/${row.id}`}
                          prefetch={false}
                          className="block rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-primary/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold leading-tight">{row.name}</p>
                            <ScorePill score={row.match?.score} />
                          </div>
                          <p className="mt-1 text-xs text-on-surface-variant">{getRole(row.roleSlug)?.title ?? row.roleSlug}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-outline">
                            <span>{ago(row.createdAt)}</span>
                            {late && (
                              <span className="chip bg-error-container px-2 py-0.5 text-[11px] text-error">
                                <AlarmClock size={11} aria-hidden /> over 48 h
                              </span>
                            )}
                            {row.isSample && <span className="chip bg-surface-container px-2 py-0.5 text-[11px]">sample</span>}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className={`rounded-[1.75rem] p-5 ${warn ? "bg-error-container" : "bg-white shadow-[var(--shadow-soft)]"}`}>
      <dt className={`text-sm font-semibold ${warn ? "text-error" : "text-on-surface-variant"}`}>{label}</dt>
      <dd className={`mt-1 font-display text-4xl font-extrabold ${warn ? "text-error" : "text-on-surface"}`}>{value}</dd>
    </div>
  );
}
