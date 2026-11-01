// Fills the database with the clearly labelled sample candidates in samples.ts.
// Usage: npm run seed   (uses DATABASE_URL if set, otherwise local PGlite)
// Re-running is safe: existing samples are removed first.
import { createHash, randomBytes } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { extractText } from "unpdf";
import { getRole } from "../src/data/roles";
import { getDb, schema } from "../src/lib/db";
import { assessRoles } from "../src/lib/match/assess";
import { parseResume } from "../src/lib/resume/parse";
import { pipeline } from "../src/lib/stages";
import { makePdf } from "./pdf";
import { samples } from "./samples";

async function main() {
  const db = await getDb();

  const old = await db
    .select({ id: schema.applications.id, resumeId: schema.applications.resumeId })
    .from(schema.applications)
    .where(eq(schema.applications.isSample, true));
  if (old.length) {
    await db.delete(schema.applications).where(inArray(schema.applications.id, old.map((row) => row.id)));
    await db.delete(schema.resumes).where(inArray(schema.resumes.id, old.map((row) => row.resumeId)));
  }

  for (const sample of samples) {
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
        ipHash: "seed",
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
        ipHash: "seed",
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: schema.applications.id });

    // Walk the pipeline up to the sample's stage so the history looks like a real one.
    const path = sample.stage === "not_selected" ? ["applied", "in_review", "not_selected"] : pipeline.slice(0, pipeline.indexOf(sample.stage) + 1);
    const step = (sample.hoursAgo * 3_600_000) / (path.length + 1);
    for (const [index, stage] of path.entries()) {
      const last = index === path.length - 1;
      await db.insert(schema.events).values({
        applicationId: application.id,
        stage: stage as (typeof pipeline)[number],
        actor: index === 0 ? "candidate" : stage === "in_review" ? "system" : "recruiter",
        note: last && index > 0 ? (sample.recruiterNote ?? null) : null,
        createdAt: new Date(createdAt.getTime() + index * step),
      });
    }
    console.log(`${name.padEnd(18)} ${role.title.padEnd(32)} ${sample.stage.padEnd(13)} ${match?.score ?? "-"}% (${match?.engine}, parsed by ${engine})`);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
