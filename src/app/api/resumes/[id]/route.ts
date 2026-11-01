import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";

// Recruiter-only (see middleware): stream the original PDF back.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return new Response("Not found", { status: 404 });

  const db = await getDb();
  const resume = await db.query.resumes.findFirst({
    where: eq(schema.resumes.id, id.data),
    columns: { fileName: true, dataBase64: true },
  });
  if (!resume) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(resume.dataBase64, "base64"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resume.fileName.replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
