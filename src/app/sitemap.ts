import type { MetadataRoute } from "next";
import { roles } from "@/data/roles";
import { siteUrl } from "@/lib/request";
import { ROLES_CAPTURED_AT } from "@/lib/seo";

// Fixed dates (not "now" on every request), so search engines can trust lastModified.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/careers`, lastModified: ROLES_CAPTURED_AT, changeFrequency: "weekly", priority: 1 },
    ...roles.map((role) => ({
      url: `${base}/careers/${role.slug}`,
      lastModified: ROLES_CAPTURED_AT,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
