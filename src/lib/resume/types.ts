export type Education = {
  degree: string | null;
  institution: string | null;
  year: number | null;
};

export type ParsedResume = {
  name: string | null;
  email: string | null;
  phone: string | null;
  links: {
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
  };
  education: Education[];
  graduationYear: number | null;
  skills: string[];
  headline: string | null;
};

export type Engine = "gemini" | "rules";

export const emptyResume: ParsedResume = {
  name: null,
  email: null,
  phone: null,
  links: { linkedin: null, github: null, portfolio: null },
  education: [],
  graduationYear: null,
  skills: [],
  headline: null,
};
