import "server-only";
import { eq } from "drizzle-orm";
import { getRole } from "@/data/roles";
import { getDb, schema } from "@/lib/db";
import { assessRoles } from "./assess";
import type { MatchResult } from "./types";

// Assess an application against its role and store the result. Called right after
// someone applies, and again (lazily) when a recruiter opens an application that
// has no match yet, so a failed background run never leaves a gap.
export async function computeAndStoreMatch(applicationId: string): Promise<MatchResult | null> {
  const db = await getDb();
  const application = await db.query.applications.findFirst({
    where: eq(schema.applications.id, applicationId),
    columns: { roleSlug: true, resumeId: true },
  });
  if (!application) return null;
  const role = getRole(application.roleSlug);
  const resume = await db.query.resumes.findFirst({
    where: eq(schema.resumes.id, application.resumeId),
    columns: { text: true, parsed: true },
  });
  if (!role || !resume) return null;

  const match = (await assessRoles([role], resume.text, resume.parsed.skills)).get(role.slug) ?? null;
  if (match) {
    await db.update(schema.applications).set({ match }).where(eq(schema.applications.id, applicationId));
  }
  return match;
}
