import rolesJson from "./roles.json";

export type RoleType = "internship" | "full-time";

export type Role = {
  slug: string;
  title: string;
  team: string;
  type: RoleType;
  location: string;
  summary: string;
  experience: string | null;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  sourceUrl: string;
};

// Copied verbatim from cynbit.in/careers on 1 Nov 2026. In production these rows
// come from Cynbit's existing jobs table; the shape matches what the live pages render.
export const roles = rolesJson as Role[];

export function getRole(slug: string): Role | undefined {
  return roles.find((role) => role.slug === slug);
}

export const teams = Array.from(new Set(roles.map((role) => role.team)));

export const roleCounts = {
  total: roles.length,
  internships: roles.filter((role) => role.type === "internship").length,
  fullTime: roles.filter((role) => role.type === "full-time").length,
};
