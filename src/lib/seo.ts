import type { Role } from "@/data/roles";
import { siteUrl } from "@/lib/request";

// cynbit.in shows no posting date. Until Cynbit's jobs table supplies one
// (created_at), the date these roles were copied stands in. [CONFIRM]
export const ROLES_CAPTURED_AT = "2026-11-01";

const hiringOrganization = {
  "@type": "Organization",
  name: "Cynbit Technologies",
  sameAs: "https://www.cynbit.in",
  logo: "https://www.cynbit.in/logo.svg",
};

// schema.org JobPosting, the markup Google for Jobs reads. The live job pages
// have none, so they can't appear in Google's job search.
export function jobPostingJsonLd(role: Role) {
  const remote = /remote/i.test(role.location);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description: [
      `<p>${role.summary}</p>`,
      "<p><strong>Responsibilities</strong></p>",
      `<ul>${role.responsibilities.map((item) => `<li>${item}</li>`).join("")}</ul>`,
      "<p><strong>Requirements</strong></p>",
      `<ul>${role.requirements.map((item) => `<li>${item}</li>`).join("")}</ul>`,
    ].join(""),
    identifier: { "@type": "PropertyValue", name: "Cynbit Technologies", value: role.slug },
    datePosted: ROLES_CAPTURED_AT,
    employmentType: role.type === "internship" ? "INTERN" : "FULL_TIME",
    hiringOrganization,
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: "32/115 Pratap Nagar",
        addressLocality: "Jaipur",
        addressRegion: "Rajasthan",
        postalCode: "302033",
        addressCountry: "IN",
      },
    },
    ...(remote && {
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: { "@type": "Country", name: "India" },
    }),
    directApply: true,
    url: `${siteUrl()}/careers/${role.slug}`,
  };
}
