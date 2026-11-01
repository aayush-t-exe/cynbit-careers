import { describe, expect, it } from "vitest";
import { normalisePhone, parseResumeWithRules } from "@/lib/resume/parse-rules";

const sample = `PRIYA SHARMA
Full-stack developer · Jaipur
priya.sharma@example.com | +91 98765 43210
linkedin.com/in/priya-sharma-dev | github.com/priyadev | priyasharma.dev

EDUCATION
B.Tech in Computer Science
Jaipur Engineering College, 2023 - 2027
Senior Secondary (12th), Delhi Public School, 2023

SKILLS
React, Next.js, TypeScript, Node.js, Express, PostgreSQL, MongoDB, Docker, Git

PROJECTS
Campus events app: built REST APIs with Express and a React dashboard.`;

describe("parseResumeWithRules", () => {
  const parsed = parseResumeWithRules(sample);

  it("reads contact details", () => {
    expect(parsed.name).toBe("Priya Sharma");
    expect(parsed.email).toBe("priya.sharma@example.com");
    expect(parsed.phone).toBe("+91 98765 43210");
  });

  it("separates LinkedIn, GitHub and a personal site", () => {
    expect(parsed.links.linkedin).toBe("https://linkedin.com/in/priya-sharma-dev");
    expect(parsed.links.github).toBe("https://github.com/priyadev");
    expect(parsed.links.portfolio).toBe("https://priyasharma.dev");
  });

  it("takes the graduation year from the degree, not from school", () => {
    expect(parsed.graduationYear).toBe(2027);
    expect(parsed.education[0].degree).toMatch(/b\.?tech/i);
  });

  it("maps skills onto the shared vocabulary", () => {
    expect(parsed.skills).toEqual(
      expect.arrayContaining(["React", "Next.js", "TypeScript", "Node.js", "SQL", "NoSQL", "Docker", "Git"]),
    );
  });

  it("returns nulls instead of guessing on an empty document", () => {
    const empty = parseResumeWithRules("");
    expect(empty.name).toBeNull();
    expect(empty.email).toBeNull();
    expect(empty.skills).toEqual([]);
  });
});

describe("normalisePhone", () => {
  it.each([
    ["9876543210", "+91 98765 43210"],
    ["+91-98765-43210", "+91 98765 43210"],
    ["098765 43210", "+91 98765 43210"],
  ])("formats %s", (input, expected) => {
    expect(normalisePhone(input)).toBe(expected);
  });

  it("rejects fragments", () => {
    expect(normalisePhone("12345")).toBeNull();
  });
});
