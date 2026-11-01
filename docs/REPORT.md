# Technical report: rebuilding Cynbit's careers flow

Aayush Thakur · Full Stack Developer Intern application · 2 Nov 2026
Live prototype: https://cynbit-careers-beta.vercel.app · Code: https://github.com/aayush-t-exe/cynbit-careers
Recruiter view: `/recruiter` (the demo password is shown on the sign-in page)

## 1. Summary

I audited cynbit.in from a user's and a developer's point of view and chose one area to improve: hiring. The careers flow is where Cynbit meets hundreds of applicants, and where its own team spends time every day.

The prototype replaces a 22-field form (21 required, no résumé upload) with a résumé-first flow. A candidate drops a PDF, sees how they fit all 20 roles, applies with five required inputs, and gets a private tracker. Recruiters get a pipeline board, an alert for applications past Cynbit's own 48-hour review promise, and a requirement-by-requirement match with quotes from each résumé. The job pages now carry Google for Jobs data, and `/careers` loads its main content in 2.4 s on a phone instead of 11.0 s (Lighthouse mobile 56 → 94).

I built it on the same stack as cynbit.in (Next.js 15.5 App Router, Server Actions, Tailwind v4, Cynbit's own colour tokens), so it can be merged into the existing codebase.

## 2. How I analysed the site

- As a user, I went through every flow on a phone and a desktop: finding a role, applying, contacting sales, BitElevate.
- I measured Lighthouse 12.8 (3 interleaved runs per page, mobile and desktop) on 5 key pages, broke down page weight, crawled all 82 sitemap URLs, and checked for overflow at 320-430 px.
- As a developer, I read the served HTML, RSC payload, JS chunks and response headers to see how pages render, where data comes from, and how forms submit. I only read what the site serves publicly; I didn't submit any forms or probe the server.

## 3. Problem statement

### What candidates hit

| Finding | Evidence |
| --- | --- |
| The apply form has 22 fields, 21 marked required, the same for interns and experienced hires | Date of birth, gender, WhatsApp, permanent address, notice period, CGPA scale, a repeatable qualification block, an "architectural narrative" |
| No résumé upload | Only a "Portfolio / Resume Link" text field; candidates must host the PDF elsewhere |
| Graduation year defaults to 2025 | Hard-coded default in the form markup |
| Little feedback right after applying | The page shows a toast. Cynbit does have a candidate progress page (`/candidate/<id>`, I saw mine through my assessment email), but it shows broad stages without dates, and candidates only reach it later. The role pages promise review "within 48 hours by our lead technical architects", which a candidate can't check when they apply |
| Hard to find the right role | 20 roles in a card grid with no filters or search, placed below three "why us" sections |
| No pay, duration or posting date on any role | Checked all 20 role pages |

### What the hiring team gets

All applications land in one place. There are no stages, no way to see which ones are waiting, and no help reading 200+ résumés against each role's requirements.

### What search engines and link previews get

- No `JobPosting` structured data, so the roles cannot appear in Google's job search.
- The share image on 56 pages is `logo.svg`, which LinkedIn and WhatsApp don't render.
- 81 of 82 pages have no canonical URL. The sitemap points at `cynbit.in`, which answers with a temporary 307 redirect to `www`.

### Speed

| `/careers` on cynbit.in | Mobile | Desktop |
| --- | --- | --- |
| Lighthouse performance | 56 | 87 |
| Largest Contentful Paint | 11.0 s | 2.2 s |

Most of the delay comes from the page itself. The `(marketing)/template.tsx` wrapper renders page content at `opacity: 0` until about 600 KB of JavaScript has run (54 hidden elements on `/careers`). On top of that, a render-blocking 1.14 MB Material Symbols font loads to draw a few dozen icons.

### Why this area

It covers all four of the brief's categories: functionality (résumé upload, tracking), UX (5 inputs instead of 21), performance (careers pages) and a new capability (matching). It also uses what Cynbit sells. Its blog has posts on AI in hiring and on AI document extraction, and this applies both to Cynbit's own hiring.

## 4. Who it's for and what success looks like

| User | Job to be done | Measure |
| --- | --- | --- |
| Student or experienced candidate, often on a phone from LinkedIn or Internshala | Find the right role and apply without retyping a résumé | Application completion rate, time to apply |
| Cynbit's hiring team | Read applications fast, keep the 48-hour promise, keep candidates informed | Time to first review, applications past 48 h, qualified applicants per role |
| Search | Index each role as a job | Rich Results Test passes; roles appear in Google's job search |

## 5. What I built

1. A résumé-first careers page. You drop a PDF on the hero; it is read once and all 20 roles are ranked, with a short explanation for the top three, written to the candidate. The role list then shows a fit score for every role and can be sorted by it. Filters (type, team, search) are kept in the URL.
2. Role pages with the role text verbatim from cynbit.in, a facts card, `JobPosting` JSON-LD, a canonical URL and a generated share image.
3. An apply form that takes about a minute. Five inputs are required: résumé, name, email, phone, consent. Everything the résumé contains is filled in and highlighted so the candidate can check it. The form is a plain multipart form posting to a Server Action, so it works with JavaScript disabled (tested).
4. A candidate tracker at an unguessable URL (144-bit token), showing the current stage, dated history, and any message the team adds. Cynbit already has a candidate progress page; this version is available the moment someone applies, and it updates when a recruiter moves the application on the board.
5. A recruiter view (`/recruiter`, signed cookie) with counts, a 6-column pipeline board sorted by match, an alert for applications past 48 hours, and a detail page. The detail page shows contact links (including WhatsApp), the PDF, parsed skills, the requirement-by-requirement match with quotes, stage changes with an optional message to the candidate, and history. Opening an application moves it to "In review" automatically, so the candidate sees that someone has looked.

## 6. Technical choices

| Choice | Why |
| --- | --- |
| Next.js 15.5 App Router + Server Actions | Same as cynbit.in. Server Actions give progressive enhancement for free: the form posts without JS and upgrades with it |
| Static role pages (`generateStaticParams`) | Role pages are prebuilt and served from the CDN. On cynbit.in they render in the US on every request (0.7-1.3 s to first byte measured on `/blog`) |
| Tailwind v4 with Cynbit's Material 3 tokens, Plus Jakarta Sans + Manrope via `next/font` | Looks like Cynbit and drops into their codebase; fonts are self-hosted with no layout shift |
| Inline SVG icons (lucide), CSS-only motion | Removes the 1.14 MB icon font and framer-motion from these pages |
| Postgres + Drizzle; Neon in production, PGlite locally | Real SQL with typed queries. PGlite (Postgres compiled to WASM) means `npm install && npm run dev` works with zero setup. I chose Neon over Supabase because Supabase's free projects pause after a week of inactivity, which would break the demo for a reviewer |
| `unpdf` for text extraction | Serverless-friendly PDF.js build, no native dependencies |
| Gemini `gemini-3.5-flash-lite`, structured JSON output | I measured about 1.5 s per call on this key; larger models timed out at 60 s. Output is validated with Zod and checked against the source text (section 7) |
| `after()` for matching | The candidate gets their tracker immediately and the match runs after the response. If that background run fails, the recruiter page computes it on first open |

### Data model

```
resumes       id, file_name, size_bytes, sha256, data_base64, text, parsed (jsonb), parsed_by, ip_hash, created_at
applications  id, token (unique), role_slug, resume_id → resumes, name, email, phone, whatsapp, linkedin, github,
              portfolio, graduation_year, note, stage, match (jsonb), is_sample, ip_hash, created_at, updated_at
              unique (role_slug, email)
events        id, application_id → applications, stage, note, actor (candidate | recruiter | system), created_at
```

A résumé is stored separately from an application, so the PDF read in the hero is reused when the candidate applies, with no second upload. Roles stay in a typed JSON file copied from cynbit.in; in Cynbit's codebase they would come from its existing jobs table.

## 7. Implementation notes

### Résumé reading

1. Intake: the file must start with the `%PDF-` magic bytes, since the name and MIME type can't be trusted. The limit is 3 MB, with 20 uploads per hour per network, keyed by a salted hash of the IP. Raw IPs are never stored.
2. Text is extracted with `unpdf`. If a PDF has no text layer (a scan), the PDF itself is sent to Gemini, which can read page images.
3. A rule-based parser always runs: regexes for email, Indian and international phones, LinkedIn/GitHub/portfolio links, degrees and years, plus a shared skill vocabulary. Gemini's structured output is then merged in with one rule: an email, phone or link from the model is kept only if it literally appears in the PDF text. Otherwise the rule-based value wins.

### Matching

- Ranking all 20 roles is rule-based, so it's instant, free and deterministic. Requirements and résumé skills are mapped onto one vocabulary, so "React/Next.js" in a requirement and "Next.js" in a résumé meet.
- The top three (hero), or the applied role (recruiter view), are assessed by Gemini per requirement: met, partly or missing, each with a word-for-word quote. Every quote is checked against the résumé text, and a "met" or "partly" without a real quote is downgraded.
- The score is computed in code from the verdicts (met = 1, partly = ½), so the same verdicts always give the same number.
- The prompt excludes protected or irrelevant signals (name, gender, age, college prestige, location, photos) and tells the model to treat the résumé as data, so instructions hidden in a résumé are ignored.
- Every result records its engine (`gemini` or `rules`), and the UI shows which one was used.
- The recruiter page says plainly that the score helps people read faster and doesn't decide. The only automatic stage change is "In review", when a person opens an application.

### Security and privacy

- Recruiter area: the password is compared with `timingSafeEqual`, then the server sets a 12-hour HS256 JWT in an HTTP-only, SameSite=Lax cookie. Middleware protects `/recruiter/*` and `/api/resumes/*`.
- PDFs are served only to signed-in recruiters, with `Cache-Control: private, no-store` and `nosniff`.
- The app sends security headers that cynbit.in doesn't: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Spam protection is a honeypot field, per-network rate limits, and duplicate detection (the same email and role sends the candidate to their existing tracker).
- The form doesn't ask for date of birth, gender or address, in line with the data minimisation principle of India's DPDP Act, 2023.
- The prototype is marked `noindex` and has a banner saying it isn't the official site. One environment variable (`ALLOW_INDEXING`) turns indexing on for production.

### Accessibility

Labels are tied to inputs, errors are linked with `aria-describedby`, and `aria-live` regions announce upload progress and filter counts. There's a skip link and visible focus rings, and I checked the contrast ratios and wrote them next to the colour tokens. All text is server-rendered. Scroll reveals hide content only when JS is running and the visitor allows motion, with a 2.5 s failsafe. Under `prefers-reduced-motion`, the hero animation shows its finished state.

## 8. Testing and results

### Automated tests

- 16 unit tests (Vitest) cover résumé parsing (contact details, link types, graduation year from the degree rather than school, skill mapping, nulls instead of guesses) and matching (met / partial rules, soft requirements never "met", scoring, ranking sanity).
- 23 end-to-end checks run in headless Edge:
  - rejecting a non-PDF
  - reading a résumé and suggesting roles
  - fit scores on the list, and URL-synced filters
  - autofill
  - submit and tracker
  - duplicate detection
  - server-side validation
  - recruiter sign-in (and wrong password)
  - board, detail and match
  - automatic "In review"
  - stage change and message showing on the tracker
  - private résumé download
  - no overflow on phones
  - applying with JavaScript disabled

### Before and after

| | cynbit.in | Prototype |
| --- | --- | --- |
| Required inputs to apply | 21 | 5 |
| Résumé upload | No (link only) | Yes, fills the form |
| Status right after applying | Toast (progress page link arrives later by email) | Private tracker link with dated stages |
| JobPosting structured data | 0 of 20 roles | 20 of 20 |
| Share image | SVG (not rendered) | PNG per role |
| Apply without JavaScript | No | Yes |
| Lighthouse mobile, `/careers` | 56 | 94 |
| LCP mobile, `/careers` | 11.0 s | 2.4 s |
| Lighthouse desktop, `/careers` | 87 | 100 |
| Accessibility, `/careers` | 90 | 97 |
| Lighthouse mobile, a role page | 54 | 97 |
| LCP mobile, a role page | 11.1 s | 2.3 s |
| Lighthouse desktop, a role page | 79 | 100 |

These are Lighthouse 12.8 medians of 3 runs per preset. I tested the two sites back to back, alternating, on the same laptop and connection on 1 Nov 2026. The laptop is slow (Lighthouse warns about its CPU), so the absolute numbers are pessimistic; the gap between the two sites is what matters. The prototype's SEO score (69) fails only "page is blocked from indexing", which is deliberate (`noindex` on a prototype); with `ALLOW_INDEXING=true` that audit passes.

## 9. Limitations

- Demo data is shared. For reviewers, the sign-in page shows the demo password (controlled by `SHOW_DEMO_PASSWORD`, which a real deployment leaves off), so the apply form asks for a test résumé. Sample candidates are stored with `is_sample = true` and labelled on the board.
- There are no email or WhatsApp notifications yet; the tracker link is shown on screen. Resend (email) or the WhatsApp Business API would be the next step.
- cynbit.in shows no posting date, so `datePosted` in the JSON-LD uses the date the roles were copied. In production it should come from the jobs table.
- On the Gemini free tier, Google may use prompts to improve its products. For real candidates' data, Cynbit should use a paid key (which excludes that) or a model it hosts.
- AI verdicts can differ a little between runs. The same test résumé scored 88% for Full Stack Developer Intern in the careers hero (three roles assessed together, written to the candidate) and 100% in the recruiter view (one role, written to the recruiter). The recruiter view's stored score is the one of record, and "Re-check" runs it again.
- Rule-based matching is coarse. It's the fallback, and it's labelled "keyword check" where shown.

## 10. Next steps for cynbit.in

1. Merge this flow: add the three tables, point `roles.json` at the existing jobs table, and keep the existing `submitCandidateApplication` action as a thin wrapper.
2. Fix the site-wide render delay by replacing the opacity-0 template with a CSS reveal that leaves text visible. This alone should take most pages from an LCP of about 11 s on mobile to a few seconds.
3. Subset the icon font (or use inline SVG), which saves about 1.1 MB per visit.
4. Add per-page titles and canonicals for case studies and diaries, point the sitemap at `www`, and add a PNG share image.
5. Post the stipend or salary and the duration on every role.
