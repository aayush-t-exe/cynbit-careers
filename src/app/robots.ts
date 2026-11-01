import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/request";

export default function robots(): MetadataRoute.Robots {
  // The prototype stays out of search results; on cynbit.in, ALLOW_INDEXING=true opens the job pages.
  if (process.env.ALLOW_INDEXING !== "true") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/recruiter", "/applications", "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
