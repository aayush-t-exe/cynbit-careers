# Cynbit careers, rebuilt

A working prototype of a better hiring flow for [cynbit.in/careers](https://www.cynbit.in/careers), built for Cynbit's Full Stack Developer Intern assessment.

**Live:** _added after deploy_ · **Report:** [`docs/REPORT.md`](docs/REPORT.md) · **Recruiter demo password:** `cynbit-demo-2026`

> Prototype only. Applications sent here don't reach Cynbit, and the recruiter view is shared with anyone who has this README. Use a test résumé.

## The problem

I went through Cynbit's careers pages as a candidate and as a developer:

| On cynbit.in today | Why it matters |
| --- | --- |
| The apply form has **22 fields, 21 required**, including date of birth, gender, permanent address and notice period, even for interns | Long forms lose candidates, and most of that data isn't needed to screen anyone (data minimisation under India's DPDP Act, 2023) |
| No résumé upload, only a link field | Candidates have to host their PDF somewhere first |
| After applying you see a toast, nothing else | The page promises a review "within 48 hours", but nobody can check it |
| 20 roles, no filters, roles start below three "why us" sections | Hard to find the right role |
| No `JobPosting` structured data on job pages | The roles can't appear in Google's job search |
| `/careers` scores 56 on Lighthouse mobile, LCP 10.9 s | Page content starts at `opacity: 0` until ~600 KB of JS runs, plus a 1.14 MB icon font |

## What I built

**For candidates**
- **Drop a résumé, see where you fit.** The careers page reads a PDF and ranks all 20 roles against it, with a short "why" for the top three.
- **Apply in about a minute.** The form fills itself from the résumé. Five required inputs instead of twenty-one. It also works with JavaScript turned off.
- **A private tracker.** Every application gets a link that shows its stage with dates, and any message the team adds.

**For Cynbit's hiring team** (`/recruiter`)
- A pipeline board (Applied → In review → Shortlisted → Interview → Offer / Not selected).
- A count of applications **past the 48-hour review promise**.
- Each application is checked against **the role's own listed requirements**: met / partly / not shown, each with a quote from the résumé. Opening an application marks it "In review" on the candidate's tracker.

**For search and sharing**
- `JobPosting` JSON-LD on all 20 role pages, per-role titles, canonical URLs, a sitemap, and a generated PNG share image per role.

## How the AI part stays honest

Résumé reading and matching use Google Gemini, with guardrails:

1. **Contact details must literally appear in the PDF.** If the model returns an email or phone that isn't in the text, it is thrown away and the rule-based value is used.
2. **Every "met" needs a quote.** The model must quote the résumé for each requirement; if the quote isn't found in the text, the verdict is downgraded.
3. **The score is computed in code** from those verdicts (met = 1, partly = ½), never asked of the model.
4. **The model is told to ignore** name, gender, age, college prestige and location, and to treat the résumé as data (instructions inside a résumé are ignored).
5. **Rule-based fallback** for everything: if the key is missing, the model times out (12–15 s) or returns bad JSON, parsing and matching still work, and the UI says which engine was used.
6. **A human moves every stage.** The score helps someone read faster; it doesn't reject anyone.

## Stack

Chosen to match Cynbit's own site, so this could be merged rather than rewritten:

| | |
| --- | --- |
| Framework | Next.js 15.5 App Router, React 19, Server Actions (same as cynbit.in) |
| Styling | Tailwind CSS v4 with Cynbit's own Material 3 colour tokens, Plus Jakarta Sans + Manrope |
| Database | Postgres via Drizzle ORM: Neon in production, PGlite (Postgres in WASM) locally, so it runs with zero setup |
| PDF text | `unpdf` |
| AI | Gemini (`gemini-3.5-flash-lite`) via `@google/genai`, structured JSON output, validated with Zod |
| Auth | Signed HTTP-only cookie (`jose`) for the recruiter area |
| Tests | Vitest (parsing, matching, scoring) and a headless-browser end-to-end run |

## Run it locally

```bash
npm install
cp .env.example .env.local   # add a Gemini key (optional: rules work without it) and a recruiter password
npm run seed                 # optional: 8 clearly labelled sample candidates
npm run dev                  # http://localhost:3000/careers
npm test
```

Without `DATABASE_URL` the app uses a local PGlite database in `.data/`.

## Project layout

```
src/app/careers            careers board + role pages (static, with JobPosting JSON-LD)
src/app/applications       candidate tracker (private token link)
src/app/recruiter          sign-in, pipeline board, application detail
src/app/actions            server actions: read résumé, apply, move stage, re-check match
src/lib/resume             PDF intake, rule-based and Gemini parsing
src/lib/match              rule-based ranking, Gemini requirement checks, scoring
src/lib/db                 Drizzle schema, Neon / PGlite connection
src/data/roles.json        the 20 roles, copied verbatim from cynbit.in/careers (1 Nov 2026)
scripts/seed.ts            sample candidates (stored with is_sample = true)
```
