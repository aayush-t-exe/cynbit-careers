import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Check, CircleDashed, PartyPopper, X } from "lucide-react";
import { getRole } from "@/data/roles";
import { CopyLink } from "@/components/copy-link";
import { getDb, schema } from "@/lib/db";
import type { Stage } from "@/lib/db/schema";
import { pipeline, stageInfo } from "@/lib/stages";
import { formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your application",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string; already?: string }>;
};

export default async function TrackerPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { new: isNew, already } = await searchParams;
  if (!/^[\w-]{20,40}$/.test(token)) notFound();

  const db = await getDb();
  const application = await db.query.applications.findFirst({ where: eq(schema.applications.token, token) });
  if (!application) notFound();
  const role = getRole(application.roleSlug);
  const history = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.applicationId, application.id))
    .orderBy(asc(schema.events.createdAt));

  const reachedAt = new Map<Stage, Date>();
  for (const event of history) if (!reachedAt.has(event.stage)) reachedAt.set(event.stage, event.createdAt);
  const closed = application.stage === "not_selected";
  const currentIndex = pipeline.indexOf(application.stage);
  const steps = closed ? [...pipeline.filter((stage) => reachedAt.has(stage)), "not_selected" as Stage] : pipeline;
  const firstName = application.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      {isNew && (
        <div className="rise mb-8 flex items-start gap-4 rounded-[2rem] bg-primary p-6 text-white shadow-[var(--shadow-lift)]">
          <PartyPopper className="mt-1 shrink-0" size={26} aria-hidden />
          <div>
            <p className="font-display text-2xl font-bold">Application sent, {firstName}.</p>
            <p className="mt-1 text-white/85">
              This page is your private tracker. Bookmark it or copy the link: it&apos;s the only way to get back here.
            </p>
          </div>
        </div>
      )}
      {already && (
        <p className="mb-8 rounded-2xl bg-tertiary-fixed px-5 py-4 font-semibold text-on-tertiary-fixed">
          You&apos;ve already applied for this role with that email, so here&apos;s your existing application.
        </p>
      )}

      <p className="eyebrow text-primary">Your application</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">{role?.title ?? application.roleSlug}</h1>
      <p className="mt-3 text-on-surface-variant">
        {application.name} · applied {formatWhen(application.createdAt)}
      </p>
      <div className="mt-5">
        <CopyLink />
      </div>

      <div className="card mt-10 p-6 sm:p-8">
        <p className="font-display text-2xl font-bold">{stageInfo[application.stage].label}</p>
        <p className="mt-2 leading-relaxed text-on-surface-variant">{stageInfo[application.stage].candidate}</p>

        <ol className="mt-8">
          {steps.map((stage, index) => {
            const reached = reachedAt.get(stage);
            const done = closed ? true : index <= currentIndex;
            const current = stage === application.stage;
            const isRejection = stage === "not_selected";
            return (
              <li key={stage} className="relative flex gap-4 pb-7 last:pb-0">
                {index < steps.length - 1 && (
                  <span className={`absolute left-[13px] top-7 h-full w-0.5 ${done && index < currentIndex ? "bg-primary" : "bg-surface-container-high"}`} aria-hidden />
                )}
                <span
                  className={`relative grid size-7 shrink-0 place-items-center rounded-full ${
                    isRejection ? "bg-on-surface-variant text-white" : done ? "bg-primary text-white" : "border-2 border-outline-variant bg-white text-outline"
                  } ${current && !isRejection ? "ring-4 ring-primary-fixed" : ""}`}
                >
                  {isRejection ? <X size={15} aria-hidden /> : done ? <Check size={15} aria-hidden /> : <CircleDashed size={15} aria-hidden />}
                </span>
                <div className="flex flex-1 flex-wrap justify-between gap-x-3">
                  <span className={`font-semibold ${done ? "" : "text-outline"}`}>
                    {stageInfo[stage].label}
                    {current && <span className="sr-only"> (current)</span>}
                  </span>
                  <span className="text-sm text-outline">{reached ? formatWhen(reached) : ""}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {history.some((event) => event.actor === "recruiter" && event.note) && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold">Messages from the team</h2>
          <ul className="mt-4 space-y-3">
            {history
              .filter((event) => event.actor === "recruiter" && event.note)
              .map((event) => (
                <li key={event.id} className="rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)]">
                  <p className="leading-relaxed">{event.note}</p>
                  <p className="mt-1 text-sm text-outline">{formatWhen(event.createdAt)}</p>
                </li>
              ))}
          </ul>
        </div>
      )}

      <p className="mt-10 text-sm text-on-surface-variant">
        Questions? Write to{" "}
        <a href="mailto:opportunities@cynbit.in" className="font-semibold text-primary hover:underline">
          opportunities@cynbit.in
        </a>{" "}
        and mention the role. <Link href="/careers#roles" className="font-semibold text-primary hover:underline">See other roles</Link>
      </p>
    </div>
  );
}
