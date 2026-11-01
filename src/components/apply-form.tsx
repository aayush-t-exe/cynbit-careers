"use client";

import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react";
import { CheckCircle2, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { readResume, submitApplication, type ApplyState } from "@/app/actions/candidate";
import { loadResume, saveResume, type StoredResume } from "@/lib/stored-resume";

type Values = {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  graduationYear: string;
};

const emptyValues: Values = { name: "", email: "", phone: "", linkedin: "", github: "", portfolio: "", graduationYear: "" };

function valuesFrom(resume: StoredResume): Partial<Values> {
  const { parsed } = resume;
  return {
    name: parsed.name ?? "",
    email: parsed.email ?? "",
    phone: parsed.phone ?? "",
    linkedin: parsed.links.linkedin ?? "",
    github: parsed.links.github ?? "",
    portfolio: parsed.links.portfolio ?? "",
    graduationYear: parsed.graduationYear ? String(parsed.graduationYear) : "",
  };
}

// Works without JavaScript: it's a plain multipart form posting to a server
// action. With JavaScript, the résumé is read first and fills the fields.
export function ApplyForm({ roleSlug, roleTitle, isInternship }: { roleSlug: string; roleTitle: string; isInternship: boolean }) {
  const [state, formAction, submitting] = useActionState<ApplyState, FormData>(submitApplication, {});
  const [values, setValues] = useState<Values>(emptyValues);
  const [filled, setFilled] = useState<Set<keyof Values>>(new Set());
  const [resume, setResume] = useState<StoredResume | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [whatsappSame, setWhatsappSame] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = state.fieldErrors ?? {};

  function apply(stored: StoredResume) {
    const next = valuesFrom(stored);
    setResume(stored);
    setValues((current) => ({ ...current, ...Object.fromEntries(Object.entries(next).filter(([, v]) => v)) }));
    setFilled(new Set(Object.entries(next).filter(([, v]) => v).map(([k]) => k as keyof Values)));
  }

  useEffect(() => {
    const stored = loadResume();
    if (stored) apply(stored);
  }, []);

  // After a failed submit, keep what the candidate typed.
  useEffect(() => {
    if (state.values) setValues((current) => ({ ...current, ...pick(state.values!) }));
  }, [state.values]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setReadError(null);
    const data = new FormData();
    data.set("resume", file);
    try {
      const result = await readResume(data);
      if (!result.ok) {
        setReadError(result.error);
        return;
      }
      const { ok: _ok, ...stored } = result;
      saveResume(stored);
      apply(stored);
    } catch {
      setReadError("The connection dropped. Try again, or fill the fields by hand and attach the PDF.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearResume() {
    saveResume(null);
    setResume(null);
    setFilled(new Set());
  }

  const field = (key: keyof Values) => ({
    name: key,
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }));
      setFilled((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    },
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
    className: `field ${filled.has(key) ? "autofilled" : ""}`,
    style: { "--i": [...filled].indexOf(key) } as CSSProperties,
  });

  return (
    <form action={formAction} className="space-y-8" noValidate={false}>
      <input type="hidden" name="roleSlug" value={roleSlug} />
      {resume && <input type="hidden" name="resumeId" value={resume.resumeId} />}
      {/* Honeypot: hidden from people and screen readers, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Step 1: the résumé, which fills everything else */}
      <div className="rounded-[2rem] border border-primary-container/30 bg-gradient-to-br from-primary-fixed/30 via-white to-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Sparkles size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">
              Résumé <span className="text-error">*</span>
            </p>
            {!resume && (
              <p className="text-sm text-on-surface-variant">Upload your PDF first. Your details fill in below; you check them.</p>
            )}
          </div>
        </div>

        {resume ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-outline-variant/60">
            <FileText className="shrink-0 text-primary" size={22} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{resume.fileName}</p>
              <p className="flex items-center gap-1 text-sm text-primary">
                <CheckCircle2 size={14} aria-hidden /> Filled {filled.size} field{filled.size === 1 ? "" : "s"} from your résumé
                {resume.engine === "gemini" ? " (read by AI, please check)" : ""}
              </p>
            </div>
            <button type="button" onClick={clearResume} className="rounded-full p-2 text-outline hover:bg-surface-container hover:text-on-surface" aria-label="Remove résumé">
              <X size={18} aria-hidden />
            </button>
          </div>
        ) : (
          <label
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
              errors.resume ? "border-error bg-error-container/30" : "border-outline-variant bg-white hover:border-primary"
            }`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              onFile(event.dataTransfer.files?.[0]);
            }}
          >
            {reading ? (
              <>
                <Loader2 className="animate-spin text-primary" size={26} aria-hidden />
                <span className="font-semibold">Reading your résumé…</span>
              </>
            ) : (
              <>
                <Upload className="text-primary" size={26} aria-hidden />
                <span className="font-semibold">
                  <span className="text-primary underline underline-offset-2">Choose a PDF</span>
                  <span className="hidden sm:inline"> or drop it here</span>
                </span>
                <span className="text-sm text-outline">Up to 3 MB</span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              name="resume"
              accept="application/pdf,.pdf"
              required={!resume}
              className="sr-only"
              aria-describedby={errors.resume || readError ? "resume-error" : undefined}
              onChange={(event) => onFile(event.target.files?.[0])}
            />
          </label>
        )}
        {(readError || errors.resume) && (
          <p id="resume-error" className="mt-2 text-sm font-semibold text-error" role="alert">
            {readError ?? errors.resume}
          </p>
        )}
      </div>

      {/* Step 2: contact details */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg font-bold">Your details</legend>
        <Field label="Full name" required error={errors.name} id="name">
          <input id="name" type="text" autoComplete="name" required maxLength={120} {...field("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" required error={errors.email} id="email">
            <input id="email" type="email" autoComplete="email" required {...field("email")} />
          </Field>
          <Field label="Phone" required error={errors.phone} id="phone" hint="With country code">
            <input id="phone" type="tel" autoComplete="tel" required placeholder="+91 98765 43210" {...field("phone")} />
          </Field>
        </div>
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="whatsappSame" checked={whatsappSame} onChange={(event) => setWhatsappSame(event.target.checked)} className="size-4 accent-primary" />
          I use this number on WhatsApp
        </label>
        {!whatsappSame && (
          <Field label="WhatsApp number" id="whatsapp">
            <input id="whatsapp" name="whatsapp" type="tel" className="field" placeholder="+91 …" />
          </Field>
        )}
      </fieldset>

      {/* Step 3: optional extras */}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg font-bold">
          Links <span className="text-sm font-semibold text-outline">(optional)</span>
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn" error={errors.linkedin} id="linkedin">
            <input id="linkedin" type="text" inputMode="url" autoCapitalize="none" placeholder="linkedin.com/in/…" {...field("linkedin")} />
          </Field>
          <Field label="GitHub" error={errors.github} id="github">
            <input id="github" type="text" inputMode="url" autoCapitalize="none" placeholder="github.com/…" {...field("github")} />
          </Field>
          <Field label="Portfolio or website" error={errors.portfolio} id="portfolio">
            <input id="portfolio" type="text" inputMode="url" autoCapitalize="none" placeholder="yoursite.com" {...field("portfolio")} />
          </Field>
          {isInternship && (
            <Field label="Graduation year" error={errors.graduationYear} id="graduationYear">
              <input id="graduationYear" type="number" inputMode="numeric" min={1990} max={2035} placeholder="2027" {...field("graduationYear")} />
            </Field>
          )}
        </div>
        <Field label={`Why ${roleTitle}?`} error={errors.note} id="note" hint="Optional, a few lines is plenty">
          <textarea id="note" name="note" rows={4} maxLength={600} defaultValue={state.values?.note} className="field" placeholder="Something you built, or what you'd like to work on at Cynbit." />
        </Field>
      </fieldset>

      <div className="space-y-4">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-on-surface-variant">
          <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-primary" aria-invalid={errors.consent ? true : undefined} />
          <span>
            I agree that Cynbit Technologies may store my application and résumé to assess me for this role, as described in the{" "}
            <a href="https://www.cynbit.in/privacy" className="font-semibold text-primary underline underline-offset-2">
              privacy policy
            </a>
            . <span className="text-error">*</span>
          </span>
        </label>
        {errors.consent && <p className="text-sm font-semibold text-error">{errors.consent}</p>}
        {state.error && (
          <p className="rounded-2xl bg-error-container px-4 py-3 text-sm font-semibold text-error" role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={submitting || reading} className="btn btn-primary w-full sm:w-auto sm:px-10">
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={18} aria-hidden /> Sending…
            </>
          ) : (
            "Send application"
          )}
        </button>
        <p className="text-sm text-outline">You&apos;ll get a private link to track your application straight away.</p>
      </div>
    </form>
  );
}

function Field({ label, required, error, id, hint, children }: { label: string; required?: boolean; error?: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-bold">
        <span>
          {label} {required && <span className="text-error">*</span>}
        </span>
        {hint && <span className="font-medium text-outline">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}

function pick(source: Record<string, string>): Partial<Values> {
  const keys: (keyof Values)[] = ["name", "email", "phone", "linkedin", "github", "portfolio", "graduationYear"];
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}
