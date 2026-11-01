import { findSkills } from "@/lib/skills";
import { emptyResume, type Education, type ParsedResume } from "./types";

const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// Indian mobiles (+91, optional 0, 10 digits starting 6–9), then a generic international fallback.
const indianPhone = /(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}\b/;
const genericPhone = /\+\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/;
const urlPattern = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s,;)|]*)?/gi;

const degreePattern =
  /\b(b\.?\s?tech|b\.?\s?e\.?|bca|b\.?\s?sc|b\.?\s?com|bba|b\.?\s?a\.?|m\.?\s?tech|m\.?\s?e\.?|mca|m\.?\s?sc|mba|ph\.?\s?d|diploma|bachelor[’'s]* of [a-z ]+|master[’'s]* of [a-z ]+|senior secondary|higher secondary|class xii|12th)\b/i;
const institutionPattern = /\b(university|institute|college|iit|nit|iiit|bits|school|vidyalaya|academy)\b/i;
const yearPattern = /\b(19[89]\d|20[0-3]\d)\b/g;

const notAName = /resume|curriculum|vitae|profile|contact|email|phone|@|\d|http/i;

export function parseResumeWithRules(text: string): ParsedResume {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return {
    ...emptyResume,
    name: findName(lines),
    email: text.match(emailPattern)?.[0].toLowerCase() ?? null,
    phone: normalisePhone(text.match(indianPhone)?.[0] ?? text.match(genericPhone)?.[0] ?? null),
    links: findLinks(text),
    ...findEducation(lines),
    skills: findSkills(text),
    headline: null,
  };
}

function findName(lines: string[]): string | null {
  for (const line of lines.slice(0, 6)) {
    const words = line.split(" ");
    if (words.length >= 2 && words.length <= 4 && !notAName.test(line) && /^[\p{L} .'-]+$/u.test(line)) {
      return titleCase(line);
    }
  }
  return null;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalisePhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  const bare = digits.replace(/^\+?91/, "").replace(/^0/, "");
  if (/^[6-9]\d{9}$/.test(bare)) return `+91 ${bare.slice(0, 5)} ${bare.slice(5)}`;
  return digits.length >= 8 ? digits : null;
}

function findLinks(text: string): ParsedResume["links"] {
  const withoutEmails = text.replace(new RegExp(emailPattern.source, "gi"), " ");
  const urls = withoutEmails.match(urlPattern) ?? [];
  const withScheme = (url: string) => (url.startsWith("http") ? url : `https://${url}`);

  const linkedin = urls.find((url) => /linkedin\.com\/in\//i.test(url));
  const github = urls.find((url) => /github\.com\/[a-z0-9-]+/i.test(url) && !/github\.com\/(features|about)/i.test(url));
  const portfolio = urls.find(
    (url) =>
      !/linkedin|github\.com|gmail|outlook|yahoo|google\.com|leetcode|hackerrank|codechef|codeforces/i.test(url) &&
      /\.(dev|me|io|app|in|com|site|xyz|tech|vercel\.app|netlify\.app)\b/i.test(url),
  );

  return {
    linkedin: linkedin ? withScheme(linkedin) : null,
    github: github ? withScheme(github.replace(/\/$/, "")) : null,
    portfolio: portfolio ? withScheme(portfolio) : null,
  };
}

function findEducation(lines: string[]): Pick<ParsedResume, "education" | "graduationYear"> {
  const education: Education[] = [];

  lines.forEach((line, index) => {
    const degree = line.match(degreePattern)?.[0];
    if (!degree) return;
    const nearby = [lines[index - 1], line, lines[index + 1], lines[index + 2]].filter(Boolean).join(" ");
    const institutionLine = [line, lines[index + 1], lines[index - 1]].find(
      (candidate) => candidate && institutionPattern.test(candidate),
    );
    const years = [...nearby.matchAll(yearPattern)].map((match) => Number(match[1]));
    education.push({
      degree: degree.replace(/\s+/g, " ").trim(),
      institution: institutionLine ?? null,
      year: years.length ? Math.max(...years) : null,
    });
  });

  const graduationYear = education
    .filter((entry) => !/12th|secondary|class xii/i.test(entry.degree ?? ""))
    .map((entry) => entry.year)
    .filter((year): year is number => year !== null)
    .sort((a, b) => b - a)[0];

  return { education: education.slice(0, 4), graduationYear: graduationYear ?? null };
}
