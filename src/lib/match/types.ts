import type { Engine } from "@/lib/resume/types";

export type Verdict = "met" | "partial" | "missing";

export type RequirementCheck = {
  requirement: string;
  verdict: Verdict;
  evidence: string | null;
};

export type MatchResult = {
  score: number;
  engine: Engine;
  summary: string;
  checks: RequirementCheck[];
  computedAt: string;
};

export const verdictWeight: Record<Verdict, number> = { met: 1, partial: 0.5, missing: 0 };

// The score is always computed here from per-requirement verdicts, never asked of
// the model, so the same verdicts always give the same number.
export function scoreChecks(checks: RequirementCheck[]) {
  if (!checks.length) return 0;
  const total = checks.reduce((sum, check) => sum + verdictWeight[check.verdict], 0);
  return Math.round((total / checks.length) * 100);
}
