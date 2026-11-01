import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { extractText } from "unpdf";
import { getRole } from "@/data/roles";
import { getDb, schema } from "@/lib/db";
import type { Stage } from "@/lib/db/schema";
import { assessRoles } from "@/lib/match/assess";
import { parseResume } from "@/lib/resume/parse";
import { pipeline } from "@/lib/stages";
import { samples, type Sample } from "./data";
import { makePdf } from "./pdf";

// Replace the clearly labelled sample candidates (is_sample = true). Real
// applications are never touched. Samples are processed in parallel so this
// fits comfortably inside a serverless function's time limit.
export async function reseedSamples() {
  const db = await getDb();

  const old = await db
    .select({ id: schema.applications.id, resumeId: schema.applications.resumeId })
    .from(schema.applications)
    .where(eq(schema.applications.isSample, true));
  if (old.length) {
    await db.delete(schema.applications).where(inArray(schema.applications.id, old.map((row) => row.id)));
    await db.delete(schema.resumes).where(inArray(schema.resumes.id, old.map((row) => row.resumeId)));
  }

  return Promise.all(samples.map((sample) => insertSample(sample)));
}

async function insertSample(sample: Sample) {
  const db = await getDb();
  const role = getRole(sample.roleSlug)!;
  const pdf = makePdf(sample.resume);
  const { text } = await extractText(pdf.slice(), { mergePages: true });
  const pdfBase64 = Buffer.from(pdf).toString("base64");
  const { parsed, engine } = await parseResume({ text, pdfBase64 });
  const createdAt = new Date(Date.now() - sample.hoursAgo * 3_600_000);
  const name = parsed.name ?? sample.resume[0].replace("# ", "");

  const [resume] = await db
    .insert(schema.resumes)
    .values({
      fileName: `${name.replace(/\s+/g, "_")}_Resume.pdf`,
      sizeBytes: pdf.byteLength,
      sha256: createHash("sha256").update(pdf).digest("hex"),
      dataBase64: pdfBase64,
      text,
      parsed,
      parsedBy: engine,
      ipHash: "sample",
      createdAt,
    })
    .returning({ id: schema.resumes.id });

  const match = (await assessRoles([role], text, parsed.skills)).get(role.slug);
  const [application] = await db
    .insert(schema.applications)
    .values({
      token: randomBytes(18).toString("base64url"),
      roleSlug: role.slug,
      resumeId: resume.id,
      name,
      email: parsed.email ?? `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: parsed.phone ?? "+91 90000 00000",
      whatsapp: parsed.phone,
      linkedin: parsed.links.linkedin,
      github: parsed.links.github,
      portfolio: parsed.links.portfolio,
      graduationYear: parsed.graduationYear,
      note: sample.note ?? null,
      stage: sample.stage,
      match,
      isSample: true,
      ipHash: "sample",
      createdAt,
      updatedAt: createdAt,
    })
    .returning({ id: schema.applications.id });

  // Walk the pipeline up to the sample's stage so the history reads like a real one.
  const path: Stage[] =
    sample.stage === "not_selected" ? ["applied", "in_review", "not_selected"] : pipeline.slice(0, pipeline.indexOf(sample.stage) + 1);
  const step = (sample.hoursAgo * 3_600_000) / (path.length + 1);
  await db.insert(schema.events).values(
    path.map((stage, index) => ({
      applicationId: application.id,
      stage,
      actor: index === 0 ? ("candidate" as const) : stage === "in_review" ? ("system" as const) : ("recruiter" as const),
      note: index === path.length - 1 && index > 0 ? (sample.recruiterNote ?? null) : null,
      createdAt: new Date(createdAt.getTime() + index * step),
    })),
  );

  return { name, role: role.title, stage: sample.stage, score: match?.score ?? null, engine: match?.engine ?? engine };
}
