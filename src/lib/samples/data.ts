import type { Stage } from "@/lib/db/schema";

// Fictional candidates for the demo board. Every row is stored with is_sample = true
// and shows a "sample" tag, so nobody mistakes them for real applicants.
export type Sample = {
  roleSlug: string;
  stage: Stage;
  hoursAgo: number;
  note?: string;
  recruiterNote?: string;
  resume: string[];
};

export const samples: Sample[] = [
  {
    roleSlug: "full-stack-developer-intern",
    stage: "shortlisted",
    hoursAgo: 30,
    recruiterNote: "Strong project work. We'll message you on WhatsApp to set up a call.",
    resume: [
      "# Riya Mehta",
      "riya.mehta@example.com | +91 98290 11223 | Jaipur",
      "linkedin.com/in/riya-mehta-sample | github.com/riyamehta-sample",
      "# Education",
      "B.Tech in Computer Science, Manipal University Jaipur, 2023 - 2027",
      "# Skills",
      "JavaScript, TypeScript, React, Next.js, Node.js, Express, PostgreSQL, MongoDB, Git, Tailwind CSS",
      "# Projects",
      "Hostel mess feedback app: Next.js frontend, Express REST APIs, PostgreSQL with 1,200 student users.",
      "Expense splitter: React + Node.js, deployed on Vercel, JWT auth and MongoDB.",
    ],
  },
  {
    roleSlug: "full-stack-developer-intern",
    stage: "applied",
    hoursAgo: 3,
    note: "I want to work on products people in Jaipur actually use.",
    resume: [
      "# Arjun Rathore",
      "arjun.rathore@example.com | +91 94140 55667",
      "github.com/arjunr-sample",
      "# Education",
      "BCA, University of Rajasthan, 2025",
      "# Skills",
      "HTML, CSS, JavaScript, React, Python, Django, MySQL",
      "# Experience",
      "Freelance websites for 3 local shops using React and Django.",
    ],
  },
  {
    roleSlug: "full-stack-developer-intern",
    stage: "applied",
    hoursAgo: 61,
    resume: [
      "# Sneha Kulkarni",
      "sneha.k@example.com | +91 99876 12345 | Pune",
      "# Education",
      "B.E. Information Technology, Savitribai Phule Pune University, 2026",
      "# Skills",
      "Java, Spring Boot, SQL, HTML, CSS",
      "# Projects",
      "Library management system in Java with MySQL.",
    ],
  },
  {
    roleSlug: "backend-developer-intern",
    stage: "interview",
    hoursAgo: 75,
    recruiterNote: "Interview invite sent to your email.",
    resume: [
      "# Kabir Singh",
      "kabir.singh@example.com | +91 98111 22334",
      "github.com/kabirsingh-sample",
      "# Education",
      "B.Tech Computer Engineering, JECRC University, 2026",
      "# Skills",
      "Node.js, Express, Python, FastAPI, PostgreSQL, Redis, Docker, REST APIs, Git",
      "# Experience",
      "Backend intern, a Jaipur logistics startup (3 months): built order-tracking APIs and database migrations.",
    ],
  },
  {
    roleSlug: "ai-ml-engineer-intern",
    stage: "in_review",
    hoursAgo: 20,
    resume: [
      "# Ananya Iyer",
      "ananya.iyer@example.com | +91 90030 44556 | Chennai",
      "linkedin.com/in/ananya-iyer-sample",
      "# Education",
      "B.Tech Artificial Intelligence and Data Science, 2027",
      "# Skills",
      "Python, PyTorch, scikit-learn, pandas, LLMs, LangChain, RAG, prompt engineering",
      "# Projects",
      "Built a RAG chatbot over college notes using LangChain and an open-source LLM.",
      "Machine learning model for crop disease detection (92% validation accuracy).",
    ],
  },
  {
    roleSlug: "digital-marketing-intern",
    stage: "applied",
    hoursAgo: 8,
    resume: [
      "# Ishaan Gupta",
      "ishaan.gupta@example.com | +91 97720 88990",
      "# Education",
      "BBA, Jaipur National University, 2026",
      "# Skills",
      "SEO, Google Ads, Meta Ads, Instagram, content writing, Google Analytics, Canva",
      "# Experience",
      "Ran Instagram and Google Ads campaigns for a cafe chain; grew followers from 2k to 9k in 4 months.",
    ],
  },
  {
    roleSlug: "ui-ux-design-intern",
    stage: "not_selected",
    hoursAgo: 120,
    recruiterNote: "Thank you for applying. We went with candidates with more mobile app design work this time.",
    resume: [
      "# Meera Joshi",
      "meera.joshi@example.com | +91 98280 77665",
      "meerajoshi-sample.dev",
      "# Education",
      "B.Des Communication Design, 2025",
      "# Skills",
      "Figma, wireframing, prototyping, user research, design systems, Adobe Illustrator",
    ],
  },
  {
    roleSlug: "backend-developer",
    stage: "offer",
    hoursAgo: 200,
    recruiterNote: "Offer letter sent to your email. Welcome aboard!",
    resume: [
      "# Rohan Verma",
      "rohan.verma@example.com | +91 98765 00112 | Bengaluru",
      "github.com/rohanverma-sample | linkedin.com/in/rohan-verma-sample",
      "# Experience",
      "Backend Engineer, a fintech startup (2 years): Node.js and Go services, PostgreSQL, Kafka, AWS, Docker, Kubernetes.",
      "# Education",
      "B.Tech Computer Science, NIT Jaipur, 2023",
      "# Skills",
      "Node.js, TypeScript, PostgreSQL, Redis, AWS, Docker, Kubernetes, REST APIs, system design",
    ],
  },
];
