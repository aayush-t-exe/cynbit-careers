import "server-only";
import { createHash } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { extractText } from "unpdf";
import { getDb, schema } from "@/lib/db";
import { parseResume } from "./parse";
import type { Engine, ParsedResume } from "./types";

export const MAX_RESUME_BYTES = 3 * 1024 * 1024;
const RESUMES_PER_HOUR = 20;

export class IntakeError extends Error {}

export type IntakeResult = {
  resumeId: string;
  fileName: string;
  parsed: ParsedResume;
  engine: Engine;
  text: string;
};

export async function intakeResume(file: File, ipHash: string): Promise<IntakeResult> {
  if (!file || file.size === 0) throw new IntakeError("Choose a PDF résumé to upload.");
  if (file.size > MAX_RESUME_BYTES) throw new IntakeError("That file is over 3 MB. Export a smaller PDF and try again.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Trust the file's magic bytes, not its name or the browser's MIME type.
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new IntakeError("That doesn't look like a PDF. Save your résumé as PDF and upload it again.");
  }

  const db = await getDb();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [{ value: recent }] = await db
    .select({ value: count() })
    .from(schema.resumes)
    .where(and(eq(schema.resumes.ipHash, ipHash), gt(schema.resumes.createdAt, hourAgo)));
  if (recent >= RESUMES_PER_HOUR) throw new IntakeError("Too many uploads from this network. Try again in an hour.");

  const pdfBase64 = Buffer.from(bytes).toString("base64");
  const text = await readPdfText(bytes);
  const { parsed, engine } = await parseResume({ text, pdfBase64 });

  const [row] = await db
    .insert(schema.resumes)
    .values({
      fileName: file.name.slice(0, 120) || "resume.pdf",
      sizeBytes: file.size,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      dataBase64: pdfBase64,
      text,
      parsed,
      parsedBy: engine,
      ipHash,
    })
    .returning({ id: schema.resumes.id });

  return { resumeId: row.id, fileName: file.name, parsed, engine, text };
}

async function readPdfText(bytes: Uint8Array) {
  try {
    // unpdf detaches the buffer it is given, so hand it a copy.
    const { text } = await extractText(bytes.slice(), { mergePages: true });
    return text.replace(/\u0000/g, "").slice(0, 60_000);
  } catch {
    throw new IntakeError("We couldn't open that PDF. It may be password-protected or damaged.");
  }
}
