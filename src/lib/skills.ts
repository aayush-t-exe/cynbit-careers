// One vocabulary shared by résumé parsing and role matching, so "Next.js" in a
// résumé and "React/Next.js" in a job requirement land on the same skill.
// Each entry: canonical label → patterns matched case-insensitively on word edges.
const vocabulary: Record<string, RegExp[]> = {
  JavaScript: [/javascript/, /\bjs\b/, /es6/],
  TypeScript: [/typescript/, /\bts\b/],
  HTML: [/\bhtml5?\b/],
  CSS: [/\bcss3?\b/, /tailwind/, /\bsass\b|\bscss\b/],
  React: [/\breact(\.js|js)?\b/],
  "Next.js": [/next\.?js/],
  "React Native": [/react native/, /\bexpo\b/],
  "Node.js": [/node\.?js/, /\bexpress(\.js)?\b/, /\bnestjs\b/],
  Python: [/\bpython\b/],
  Django: [/\bdjango\b/],
  FastAPI: [/fastapi/, /\bflask\b/],
  Java: [/\bjava\b(?!script)/, /spring boot/],
  Go: [/\bgolang\b/],
  SQL: [/\bsql\b/, /postgres(ql)?/, /mysql/, /sqlite/, /supabase/],
  NoSQL: [/no-?sql/, /mongo(db)?/, /firebase/, /redis/, /dynamodb/],
  "REST APIs": [/rest(ful)? api/, /\bapis?\b/, /graphql/],
  Git: [/\bgit(hub)?\b/],
  Docker: [/docker/, /container/],
  Kubernetes: [/kubernetes/, /\bk8s\b/],
  AWS: [/\baws\b/, /amazon web services/, /\bec2\b/, /\bs3\b/, /lambda/],
  "Cloud & DevOps": [/\bgcp\b|google cloud/, /azure/, /vercel/, /ci\/cd|github actions/, /devops/, /deploy(ment)? pipeline/],
  Linux: [/linux/, /bash/, /shell scripting/],
  "Machine Learning": [/machine learning/, /\bml\b/, /scikit/, /tensorflow/, /pytorch/, /deep learning/],
  "LLMs & AI agents": [/\bllms?\b/, /large language model/, /\bagents?\b/, /openai|gemini|claude|anthropic/, /langchain|llamaindex/, /\brag\b/, /prompt/, /generative ai|gen ?ai/],
  "Data analysis": [/data analy/, /pandas/, /numpy/, /power ?bi/, /tableau/, /\bexcel\b/],
  Testing: [/\btesting\b/, /\bqa\b/, /selenium/, /cypress/, /playwright/, /jest|vitest/, /test cases?/, /bug/],
  "UI/UX design": [/figma/, /\bui\/?ux\b/, /user experience/, /wireframe/, /prototyp/, /design system/],
  "SEO & content": [/\bseo\b/, /content (writing|strategy|marketing)/, /copywriting/, /blog/],
  "Digital marketing": [/digital marketing/, /performance marketing/, /google ads|meta ads|facebook ads/, /campaign/, /email marketing/],
  "Social media": [/social media/, /instagram/, /linkedin (content|growth)/, /reels/, /brand identity/],
  "Growth & analytics": [/growth/, /funnel/, /google analytics|\bga4\b/, /a\/b test/, /acquisition/],
  "Sales & business development": [/\bsales\b/, /business development/, /lead generation/, /client acquisition/, /\bcrm\b/, /cold (email|call)/, /negotiat/],
  Communication: [/communication/, /interpersonal/, /presentation/, /public speaking/],
  "Recruiting & HR": [/recruit/, /talent acquisition/, /\bhr\b|human resources/, /onboarding/, /interview(ing)? candidates/],
  "Community & events": [
    /campus (ambassador|relations)/,
    /community (building|management|manager|lead)/,
    /event (management|planning|organi[sz])/,
    /organi[sz]ed (an? )?(event|hackathon|fest)/,
    /ambassador/,
    /student (club|chapter|body|council)/,
  ],
};

export const skillNames = Object.keys(vocabulary);

export function findSkills(text: string): string[] {
  const haystack = text.toLowerCase();
  return skillNames.filter((skill) => vocabulary[skill].some((pattern) => pattern.test(haystack)));
}

// Map a free-form skill (e.g. from the model) onto the shared vocabulary when possible.
export function canonicalSkill(raw: string): string {
  const [match] = findSkills(raw);
  return match ?? raw.trim();
}
