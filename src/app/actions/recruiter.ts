"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createSession, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { stages } from "@/lib/db/schema";
import { computeAndStoreMatch } from "@/lib/match/store";
import { reseedSamples } from "@/lib/samples/seed";

async function requireRecruiter() {
  const store = await cookies();
  if (!(await verifySession(store.get(SESSION_COOKIE)?.value))) redirect("/recruiter/login");
}

export async function login(_previous: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const expected = process.env.RECRUITER_PASSWORD ?? "";
  const given = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/recruiter");

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    return { error: "That password isn't right." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect(next.startsWith("/recruiter") ? next : "/recruiter");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/recruiter/login");
}

const moveSchema = z.object({
  id: z.uuid(),
  stage: z.enum(stages),
  note: z.string().trim().max(500).optional(),
});

export async function moveStage(formData: FormData) {
  await requireRecruiter();
  const { id, stage, note } = moveSchema.parse({
    id: formData.get("id"),
    stage: formData.get("stage"),
    note: formData.get("note") || undefined,
  });

  const db = await getDb();
  await db.update(schema.applications).set({ stage, updatedAt: new Date() }).where(eq(schema.applications.id, id));
  await db.insert(schema.events).values({ applicationId: id, stage, note: note ?? null, actor: "recruiter" });

  revalidatePath("/recruiter", "layout");
}

export async function rerunMatch(formData: FormData) {
  await requireRecruiter();
  const id = z.uuid().parse(formData.get("id"));
  await computeAndStoreMatch(id);
  revalidatePath(`/recruiter/applications/${id}`);
}

export async function reloadSamples() {
  await requireRecruiter();
  await reseedSamples();
  revalidatePath("/recruiter", "layout");
}
