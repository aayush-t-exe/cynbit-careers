import type { Role } from "@/data/roles";
import { findSkills } from "@/lib/skills";
import { scoreChecks, type MatchResult, type RequirementCheck } from "./types";

const stopwords = new Set(
  "a an and the of for to in on with or as at by from into our your their its is are be strong basic good excellent ability abilities knowledge understanding experience familiarity interest skills skill attention detail professional professionalism work working using tools frameworks".split(
    " ",
  ),
);

function contentWords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./ -]/g, " ")
    .split(/[\s/-]+/)
    .filter((word) => word.length > 2 && !stopwords.has(word));
}

export function checkRequirement(requirement: string, resumeText: string, resumeSkills: string[]): RequirementCheck {
  const needed = findSkills(requirement);

  if (needed.length) {
    const found = needed.filter((skill) => resumeSkills.includes(skill));
    const verdict = found.length === needed.length ? "met" : found.length ? "partial" : "missing";
    return { requirement, verdict, evidence: found.length ? found.join(", ") : null };
  }

  // Soft requirements ("Organizational and time-management abilities") have no
  // skill keywords; fall back to plain word overlap and never claim more than partial.
  const words = contentWords(requirement);
  const haystack = resumeText.toLowerCase();
  const hits = words.filter((word) => haystack.includes(word));
  return {
    requirement,
    verdict: hits.length >= Math.max(1, Math.ceil(words.length / 3)) ? "partial" : "missing",
    evidence: hits.length ? hits.slice(0, 4).join(", ") : null,
  };
}

export function matchWithRules(role: Role, resumeText: string, resumeSkills: string[]): MatchResult {
  const checks = role.requirements.map((requirement) => checkRequirement(requirement, resumeText, resumeSkills));
  const score = scoreChecks(checks);
  const met = checks.filter((check) => check.verdict === "met").length;
  return {
    score,
    engine: "rules",
    summary: `Keyword check: ${met} of ${checks.length} listed requirements clearly covered.`,
    checks,
    computedAt: new Date().toISOString(),
  };
}

// Ranking all 20 roles must be instant and free, so it is rule-based. The
// responsibilities add a smaller signal because they describe the day-to-day work.
export function rankRoles(roles: Role[], resumeText: string, resumeSkills: string[]) {
  return roles
    .map((role) => {
      const requirementScore = matchWithRules(role, resumeText, resumeSkills).score;
      const dutySkills = findSkills([role.title, ...role.responsibilities].join(" "));
      const dutyScore = dutySkills.length
        ? (dutySkills.filter((skill) => resumeSkills.includes(skill)).length / dutySkills.length) * 100
        : 0;
      return { role, score: Math.round(requirementScore * 0.7 + dutyScore * 0.3) };
    })
    .sort((a, b) => b.score - a.score || a.role.title.localeCompare(b.role.title));
}
