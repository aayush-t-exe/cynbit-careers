import { describe, expect, it } from "vitest";
import { getRole, roles } from "@/data/roles";
import { checkRequirement, matchWithRules, rankRoles } from "@/lib/match/rules";
import { scoreChecks } from "@/lib/match/types";
import { findSkills } from "@/lib/skills";

const resume = `Built a campus events app with React, Next.js and TypeScript.
REST APIs in Node.js and Express, PostgreSQL with Prisma, deployed on Vercel. Git and GitHub Actions.`;
const skills = findSkills(resume);

describe("checkRequirement", () => {
  it("marks a requirement met when every named skill is present", () => {
    const check = checkRequirement("Experience with React/Next.js frameworks.", resume, skills);
    expect(check.verdict).toBe("met");
    expect(check.evidence).toContain("React");
  });

  it("marks it partial when only some skills are present", () => {
    const check = checkRequirement("Familiarity with Python/Django or Node.js.", resume, skills);
    expect(check.verdict).toBe("partial");
  });

  it("never claims more than partial for soft requirements", () => {
    const check = checkRequirement("Attention to detail and professionalism.", "detail-oriented professional", []);
    expect(check.verdict).not.toBe("met");
  });
});

describe("scoring", () => {
  it("weights partial as half", () => {
    expect(
      scoreChecks([
        { requirement: "a", verdict: "met", evidence: null },
        { requirement: "b", verdict: "partial", evidence: null },
        { requirement: "c", verdict: "missing", evidence: null },
        { requirement: "d", verdict: "missing", evidence: null },
      ]),
    ).toBe(38);
  });

  it("scores the full-stack intern role highly for a full-stack résumé", () => {
    const role = getRole("full-stack-developer-intern")!;
    expect(matchWithRules(role, resume, skills).score).toBeGreaterThanOrEqual(60);
  });
});

describe("rankRoles", () => {
  it("puts engineering roles above marketing ones for an engineering résumé", () => {
    const ranked = rankRoles(roles, resume, skills);
    const top = ranked.slice(0, 3).map((entry) => entry.role.slug);
    expect(top.some((slug) => slug.includes("full-stack") || slug.includes("backend"))).toBe(true);
    const marketing = ranked.findIndex((entry) => entry.role.slug === "social-media-brand-intern");
    expect(marketing).toBeGreaterThan(5);
  });

  it("covers all 20 roles", () => {
    expect(rankRoles(roles, resume, skills)).toHaveLength(roles.length);
  });
});
