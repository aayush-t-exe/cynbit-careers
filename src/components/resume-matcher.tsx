"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { ArrowRight, FileText, RotateCcw, Upload } from "lucide-react";
import { readResume } from "@/app/actions/candidate";
import { MatchRing } from "@/components/match-ring";
import { loadResume, saveResume, type StoredResume } from "@/lib/stored-resume";

type State =
  | { kind: "demo" }
  | { kind: "reading"; fileName: string }
  | { kind: "result"; resume: StoredResume }
  | { kind: "error"; message: string };

const demoFields = [
  { label: "Name", value: "Priya Sharma" },
  { label: "Email", value: "priya@example.com" },
  { label: "Graduating", value: "B.Tech CSE, 2027" },
];
const demoSkills = ["React", "Next.js", "Node.js", "PostgreSQL"];

export function ResumeMatcher({ demoScore, demoRole }: { demoScore: number; demoRole: string }) {
  const [state, setState] = useState<State>({ kind: "demo" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadResume();
    if (stored?.suggestions.length) setState({ kind: "result", resume: stored });
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type && file.type !== "application/pdf") {
      setState({ kind: "error", message: "Please choose a PDF. Most résumé builders can export one." });
      return;
    }
    setState({ kind: "reading", fileName: file.name });
    const data = new FormData();
    data.set("resume", file);
    data.set("suggest", "1");
    try {
      const result = await readResume(data);
      if (!result.ok) {
        setState({ kind: "error", message: result.error });
        return;
      }
      const { ok: _ok, ...resume } = result;
      saveResume(resume);
      setState({ kind: "result", resume });
    } catch {
      setState({ kind: "error", message: "The connection dropped. Try again in a moment." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function reset() {
    saveResume(null);
    setState({ kind: "demo" });
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`glow grain on-ink relative overflow-hidden rounded-[2.5rem] p-5 text-on-ink shadow-[var(--shadow-lift)] transition-[outline-color] sm:p-7 ${
        dragging ? "outline-4 outline-dashed outline-primary-fixed-dim" : "outline-0"
      }`}
    >
      <input
        ref={inputRef}
        id="hero-resume"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <div aria-live="polite">
        {state.kind === "demo" && <Demo demoScore={demoScore} demoRole={demoRole} />}
        {state.kind === "reading" && <Reading fileName={state.fileName} />}
        {state.kind === "result" && <Result resume={state.resume} onReset={reset} />}
        {state.kind === "error" && (
          <div className="flex min-h-[22rem] flex-col items-start justify-center gap-4">
            <p className="eyebrow text-primary-fixed-dim">Couldn&apos;t read that one</p>
            <p className="max-w-sm font-display text-2xl font-bold">{state.message}</p>
            <button type="button" className="btn btn-on-ink" onClick={() => inputRef.current?.click()}>
              <Upload size={18} aria-hidden /> Try another PDF
            </button>
          </div>
        )}
      </div>

      {(state.kind === "demo" || state.kind === "error") && (
        <label
          htmlFor="hero-resume"
          className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-dashed border-primary-fixed-dim/50 bg-white/5 px-5 py-4 transition hover:border-primary-fixed-dim hover:bg-white/10"
        >
          <span>
            <span className="block font-display text-lg font-bold">Try it with your résumé</span>
            <span className="block text-sm text-on-ink-muted">
              <span className="hidden sm:inline">Drop a PDF here or click. </span>Up to 3 MB, read once, never shared.
            </span>
          </span>
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-fixed text-ink">
            <Upload size={20} aria-hidden />
          </span>
        </label>
      )}
    </div>
  );
}

function Demo({ demoScore, demoRole }: { demoScore: number; demoRole: string }) {
  return (
    <div>
      <p className="eyebrow mb-4 flex items-center gap-2 text-primary-fixed-dim">
        <span className="pulse-dot size-2 rounded-full bg-primary-fixed-dim" aria-hidden />
        How it works · an example
      </p>
      <div className="grid gap-4 sm:grid-cols-[1fr_1.1fr] sm:items-start">
        {/* The résumé being read */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-4 text-on-surface shadow-xl sm:-rotate-2">
          <span className="scan-beam pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-primary-fixed/70 to-transparent" style={{ "--scan-distance": "260px" } as CSSProperties} aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Example résumé</p>
          <p className="mt-2 font-display text-lg font-extrabold">
            <span className="mark-read" style={{ "--i": 0 } as CSSProperties}>Priya Sharma</span>
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="mark-read" style={{ "--i": 1 } as CSSProperties}>priya@example.com</span> · Jaipur
          </p>
          <div className="mt-3 space-y-1.5 text-[11px] leading-snug text-on-surface-variant">
            <p className="font-bold text-on-surface">Education</p>
            <p>
              <span className="mark-read" style={{ "--i": 2 } as CSSProperties}>B.Tech CSE, 2027</span>, JECRC University
            </p>
            <p className="pt-1 font-bold text-on-surface">Skills</p>
            <p>
              <span className="mark-read" style={{ "--i": 3 } as CSSProperties}>React, Next.js, Node.js, PostgreSQL</span>, Git
            </p>
            <p className="pt-1 font-bold text-on-surface">Projects</p>
            <div className="space-y-1" aria-hidden>
              <div className="h-1.5 w-11/12 rounded bg-surface-container-high" />
              <div className="h-1.5 w-9/12 rounded bg-surface-container-high" />
              <div className="h-1.5 w-10/12 rounded bg-surface-container-high" />
            </div>
          </div>
        </div>

        {/* The application filling itself */}
        <div className="space-y-2.5">
          {demoFields.map((field, index) => (
            <div
              key={field.label}
              className="lift-in rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10"
              style={{ "--i": index } as CSSProperties}
            >
              <p className="text-[11px] font-semibold text-on-ink-muted">{field.label}</p>
              <p className="font-semibold">{field.value}</p>
            </div>
          ))}
          <div className="lift-in flex flex-wrap gap-1.5" style={{ "--i": 3 } as CSSProperties}>
            {demoSkills.map((skill) => (
              <span key={skill} className="chip bg-primary-fixed-dim/20 text-primary-fixed">
                {skill}
              </span>
            ))}
          </div>
          <div className="lift-in flex items-center gap-3 rounded-2xl bg-ink/60 p-3 ring-1 ring-primary-fixed-dim/30" style={{ "--i": 4 } as CSSProperties}>
            <MatchRing score={demoScore} tone="ink" size={56} delay="2.3s" label={`Example: ${demoScore}% match`} />
            <div>
              <p className="text-[11px] font-semibold text-on-ink-muted">Best fit</p>
              <p className="font-display font-bold leading-tight">{demoRole}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Reading({ fileName }: { fileName: string }) {
  return (
    <div className="flex min-h-[22rem] flex-col items-center justify-center gap-6 text-center">
      <div className="relative h-40 w-32 overflow-hidden rounded-2xl bg-white p-3 shadow-xl" aria-hidden>
        <span className="scan-beam is-looping absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-primary-fixed/80 to-transparent" style={{ "--scan-distance": "150px" } as CSSProperties} />
        <FileText className="text-primary" size={22} />
        <div className="mt-3 space-y-1.5">
          {[10, 8, 11, 7, 9, 10, 6].map((width, index) => (
            <div key={index} className="h-1.5 rounded bg-surface-container-high" style={{ width: `${width * 9}%` }} />
          ))}
        </div>
      </div>
      <div>
        <p className="font-display text-xl font-bold">Reading {truncate(fileName, 32)}</p>
        <p className="mt-1 text-sm text-on-ink-muted">Pulling out your details and checking all 20 roles. Usually a few seconds.</p>
      </div>
    </div>
  );
}

function Result({ resume, onReset }: { resume: StoredResume; onReset: () => void }) {
  const firstName = resume.parsed.name?.split(" ")[0];
  return (
    <div>
      <p className="eyebrow text-primary-fixed-dim">From {truncate(resume.fileName, 28)}</p>
      <p className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
        {firstName ? `${firstName}, these fit you best.` : "These roles fit you best."}
      </p>
      <ol className="mt-5 space-y-3">
        {resume.suggestions.map((suggestion, index) => (
          <li
            key={suggestion.slug}
            className="rise flex gap-4 rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10"
            style={{ "--i": index } as CSSProperties}
          >
            <MatchRing score={suggestion.score} tone="ink" size={58} delay={`${0.2 + index * 0.15}s`} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold leading-tight">{suggestion.title}</p>
              <p className="mt-1 text-sm leading-snug text-on-ink-muted">
                {suggestion.match?.summary ?? "Based on the skills in your résumé."}
              </p>
              <Link
                href={`/careers/${suggestion.slug}#apply`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary-fixed hover:underline"
              >
                Apply with this résumé <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-on-ink-muted">
        <span>
          {resume.engine === "gemini" ? "Read by AI. Check the details before you apply." : "Read with keyword rules."}{" "}
          <a href="#roles" className="font-semibold text-primary-fixed underline-offset-2 hover:underline">
            Your fit on all 20 roles
          </a>
        </span>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 font-semibold text-on-ink hover:text-white">
          <RotateCcw size={14} aria-hidden /> Use a different résumé
        </button>
      </div>
    </div>
  );
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}
