"use client";

import type { RoleSuggestion } from "@/app/actions/candidate";
import type { Engine, ParsedResume } from "@/lib/resume/types";

export type StoredResume = {
  resumeId: string;
  fileName: string;
  parsed: ParsedResume;
  engine: Engine;
  suggestions: RoleSuggestion[];
  scores: Record<string, number>;
};

const KEY = "cynbit:resume";
const EVENT = "cynbit:resume";

// The résumé read in the careers hero is remembered for this tab only, so the
// role list can show fit scores and the apply form can fill itself without a
// second upload. The PDF itself stays on the server; only the parsed fields are kept.
export function saveResume(resume: StoredResume | null) {
  try {
    if (resume) sessionStorage.setItem(KEY, JSON.stringify(resume));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Private mode or storage disabled: the page still works, it just won't remember.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: resume }));
}

export function loadResume(): StoredResume | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredResume) : null;
  } catch {
    return null;
  }
}

export function onResumeChange(listener: (resume: StoredResume | null) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<StoredResume | null>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
