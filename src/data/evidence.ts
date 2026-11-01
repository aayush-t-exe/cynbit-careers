// Every number on /about, with where it came from. Lighthouse: median of 3 interleaved
// runs, Lighthouse 12.8 mobile preset, same laptop and network for both sites.
export const measuredOn = "1 Nov 2026";

export const lighthouse = {
  before: { url: "cynbit.in/careers", mobile: 56, lcp: "10.9 s", desktop: 48, a11y: 90 },
  after: { url: "this prototype /careers", mobile: null as number | null, lcp: null as string | null, desktop: null as number | null, a11y: null as number | null },
};

export const comparisons = [
  { label: "Required inputs to apply", before: "21 (of 22 fields)", after: "5" },
  { label: "Résumé", before: "A link you host yourself", after: "PDF upload that fills the form" },
  { label: "Personal data asked up front", before: "Date of birth, gender, permanent address, notice period", after: "Name, email, phone" },
  { label: "After you apply", before: "A toast message", after: "A private tracker with dated stages and team messages" },
  { label: "Which role fits me?", before: "Read 20 cards", after: "Drop your résumé, all 20 roles ranked with reasons" },
  { label: "Finding a role", before: "No filters, roles below three sections", after: "Type, team and search filters, right after the hero" },
  { label: "Google for Jobs", before: "No JobPosting data", after: "JobPosting JSON-LD on all 20 roles" },
  { label: "Link previews", before: "SVG logo (not shown by LinkedIn or WhatsApp)", after: "A PNG card per role" },
  { label: "Without JavaScript", before: "Form doesn't submit", after: "Form submits, tracker loads" },
  { label: "Recruiter side", before: "One shared inbox", after: "Pipeline board, 48-hour promise alert, requirement-by-requirement match" },
];

export const nextFixes = [
  {
    title: "Show text before JavaScript loads",
    body: "The (marketing) template wraps every page in a fade that starts at opacity 0, and the home page has 58 more hidden elements. Lighthouse puts 5.0 s of LCP on that alone. A CSS-only reveal keeps the motion and removes the wait.",
  },
  {
    title: "Subset the icon font",
    body: "Material Symbols loads all 1.14 MB (67% of the page) to draw about 40 icons, and icon names flash as words first. Requesting only the used icons, or inline SVG as here, saves over a megabyte per visit.",
  },
  {
    title: "Give every page its own title",
    body: "23 pages, including all 13 case studies, reuse the home title and description, and 81 of 82 pages have no canonical URL. The sitemap points at cynbit.in, which answers with a temporary redirect to www.",
  },
  {
    title: "Post the stipend",
    body: "None of the 20 roles shows pay or duration. Adding it is the single biggest content change for applicants, and Google for Jobs uses it too.",
  },
];
