import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { MatchResult } from "@/lib/match/types";
import type { ParsedResume } from "@/lib/resume/types";

export const stages = [
  "applied",
  "in_review",
  "shortlisted",
  "interview",
  "offer",
  "not_selected",
] as const;

export type Stage = (typeof stages)[number];

// A résumé is stored on its own so a candidate can drop it once in the careers
// hero, see matching roles, then apply without uploading it again.
export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    fileName: text("file_name").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    dataBase64: text("data_base64").notNull(),
    text: text("text").notNull(),
    parsed: jsonb("parsed").$type<ParsedResume>().notNull(),
    parsedBy: text("parsed_by").notNull(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("resumes_ip_created_idx").on(table.ipHash, table.createdAt)],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    token: text("token").notNull().unique(),
    roleSlug: text("role_slug").notNull(),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp"),
    linkedin: text("linkedin"),
    github: text("github"),
    portfolio: text("portfolio"),
    graduationYear: integer("graduation_year"),
    note: text("note"),
    stage: text("stage").$type<Stage>().notNull().default("applied"),
    match: jsonb("match").$type<MatchResult>(),
    isSample: boolean("is_sample").notNull().default(false),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("applications_role_email_idx").on(table.roleSlug, table.email),
    index("applications_stage_idx").on(table.stage),
  ],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    stage: text("stage").$type<Stage>().notNull(),
    note: text("note"),
    actor: text("actor").$type<"candidate" | "recruiter" | "system">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("events_application_idx").on(table.applicationId)],
);

export type ApplicationRow = typeof applications.$inferSelect;
export type EventRow = typeof events.$inferSelect;

// Kept next to the table definitions so the two can't drift apart. Run once per
// cold start; every statement is idempotent.
export const bootstrapSql = `
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  size_bytes integer not null,
  sha256 text not null,
  data_base64 text not null,
  text text not null,
  parsed jsonb not null,
  parsed_by text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists resumes_ip_created_idx on resumes (ip_hash, created_at);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  role_slug text not null,
  resume_id uuid not null references resumes(id),
  name text not null,
  email text not null,
  phone text not null,
  whatsapp text,
  linkedin text,
  github text,
  portfolio text,
  graduation_year integer,
  note text,
  stage text not null default 'applied',
  match jsonb,
  is_sample boolean not null default false,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists applications_role_email_idx on applications (role_slug, email);
create index if not exists applications_stage_idx on applications (stage);

create table if not exists events (
  id serial primary key,
  application_id uuid not null references applications(id) on delete cascade,
  stage text not null,
  note text,
  actor text not null,
  created_at timestamptz not null default now()
);
create index if not exists events_application_idx on events (application_id);
`;
