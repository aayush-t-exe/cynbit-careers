"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { and, count, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { getRole, roles } from "@/data/roles";
import { getDb, schema } from "@/lib/db";
import { assessRoles } from "@/lib/match/assess";
import { computeAndStoreMatch } from "@/lib/match/store";
import { rankRoles } from "@/lib/match/rules";
import type { MatchResult } from "@/lib/match/types";
import { IntakeError, intakeResume } from "@/lib/resume/intake";
import type { Engine, ParsedResume } from "@/lib/resume/types";
import { newToken, requestIpHash } from "@/lib/request";

export type RoleSuggestion = {
  slug: string;
  title: string;
  type: string;
  score: number;
  match: MatchResult | null;
};

export type ReadResumeResult =
  | {
      ok: true;
      resumeId: string;
      fileName: string;
      parsed: ParsedResume;
      engine: Engine;
      suggestions: RoleSuggestion[];
      scores: Record<string, number>;
    }
  | { ok: false; error: string };

// Used by the careers hero ("which roles fit me?") and by the apply form
// (autofill). The stored résumé is reused when the candidate applies.
export async function readResume(formData: FormData): Promise<ReadResumeResult> {
  const file = formData.get("resume");
  const wantSuggestions = formData.get("suggest") === "1";

  try {
    if (!(file instanceof File)) throw new IntakeError("Choose a PDF résumé to upload.");
    const intake = await intakeResume(file, await requestIpHash());

    const ranking = rankRoles(roles, intake.text, intake.parsed.skills);
    const scores = Object.fromEntries(ranking.map(({ role, score }) => [role.slug, score]));

    let suggestions: RoleSuggestion[] = [];
    if (wantSuggestions) {
      const ranked = ranking.slice(0, 3);
      const assessed = await assessRoles(
        ranked.map((entry) => entry.role),
        intake.text,
        intake.parsed.skills,
        "candidate",
      );
      suggestions = ranked
        .map(({ role, score }) => {
          const match = assessed.get(role.slug) ?? null;
          return { slug: role.slug, title: role.title, type: role.type, score: match?.score ?? score, match };
        })
        .sort((a, b) => b.score - a.score);
      for (const suggestion of suggestions) scores[suggestion.slug] = suggestion.score;
    }

    return {
      ok: true,
      resumeId: intake.resumeId,
      fileName: intake.fileName,
      parsed: intake.parsed,
      engine: intake.engine,
      suggestions,
      scores,
    };
  } catch (error) {
    if (error instanceof IntakeError) return { ok: false, error: error.message };
    console.error("[readResume]", error);
    return { ok: false, error: "Something went wrong reading that file. You can still fill the form by hand." };
  }
}

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((value) => (value ? (/^https?:\/\//i.test(value) ? value : `https://${value}`) : null))
  .pipe(z.url({ protocol: /^https?$/ }).nullable());

const applicationSchema = z.object({
  roleSlug: z.string().refine((slug) => Boolean(getRole(slug)), "Unknown role."),
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,18}$/, "Enter a phone number with country code, e.g. +91 98765 43210."),
  whatsappSame: z.boolean(),
  whatsapp: z.string().trim().max(24).optional(),
  linkedin: optionalUrl,
  github: optionalUrl,
  portfolio: optionalUrl,
  graduationYear: z
    .string()
    .trim()
    .transform((value) => (value ? Number(value) : null))
    .pipe(z.number().int().min(1990).max(2035).nullable()),
  note: z.string().trim().max(600, "Keep it under 600 characters.").optional(),
  consent: z.literal(true, "Please confirm you agree to Cynbit processing your application."),
});

export type ApplyState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
};

const APPLICATIONS_PER_HOUR = 10;

export async function submitApplication(_previous: ApplyState, formData: FormData): Promise<ApplyState> {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, value]) => typeof value === "string"),
  ) as Record<string, string>;

  // Bots fill every field; people never see this one.
  if (values.website) redirect("/careers");

  const parsed = applicationSchema.safeParse({
    ...values,
    whatsappSame: values.whatsappSame === "on",
    consent: values.consent === "on",
    linkedin: values.linkedin ?? "",
    github: values.github ?? "",
    portfolio: values.portfolio ?? "",
    graduationYear: values.graduationYear ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors, values };
  }

  const data = parsed.data;
  const role = getRole(data.roleSlug)!;
  const ipHash = await requestIpHash();
  const db = await getDb();

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [{ value: recent }] = await db
    .select({ value: count() })
    .from(schema.applications)
    .where(and(eq(schema.applications.ipHash, ipHash), gt(schema.applications.createdAt, hourAgo)));
  if (recent >= APPLICATIONS_PER_HOUR) {
    return { error: "Too many applications from this network in the last hour. Try again later.", values };
  }

  const existing = await db.query.applications.findFirst({
    where: and(eq(schema.applications.roleSlug, role.slug), eq(schema.applications.email, data.email)),
    columns: { token: true },
  });
  if (existing) redirect(`/applications/${existing.token}?already=1`);

  // Use the résumé read earlier on this page if there is one; otherwise read the uploaded file now.
  let resumeId = values.resumeId || null;
  if (resumeId) {
    const row = await db.query.resumes.findFirst({
      where: and(eq(schema.resumes.id, resumeId), eq(schema.resumes.ipHash, ipHash)),
      columns: { id: true },
    });
    if (!row) resumeId = null;
  }
  if (!resumeId) {
    const file = formData.get("resume");
    try {
      if (!(file instanceof File) || file.size === 0) throw new IntakeError("Attach your résumé as a PDF.");
      const intake = await intakeResume(file, ipHash);
      resumeId = intake.resumeId;
    } catch (error) {
      const message = error instanceof IntakeError ? error.message : "We couldn't read that file.";
      return { error: message, fieldErrors: { resume: message }, values };
    }
  }

  const token = newToken();
  const [application] = await db
    .insert(schema.applications)
    .values({
      token,
      roleSlug: role.slug,
      resumeId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsappSame ? data.phone : data.whatsapp || null,
      linkedin: data.linkedin,
      github: data.github,
      portfolio: data.portfolio,
      graduationYear: data.graduationYear,
      note: data.note || null,
      ipHash,
    })
    .returning({ id: schema.applications.id });

  await db.insert(schema.events).values({
    applicationId: application.id,
    stage: "applied",
    actor: "candidate",
    note: null,
  });

  // The candidate gets their tracker immediately; the slower match runs after the
  // response. If it fails, the recruiter page computes it on first open.
  after(() =>
    computeAndStoreMatch(application.id).catch((error) => console.error("[match] background run failed:", error)),
  );

  redirect(`/applications/${token}?new=1`);
}
