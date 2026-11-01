import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";

// IPs are only kept as a salted hash, enough for rate limiting and nothing else.
export async function requestIpHash() {
  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "local";
  return createHash("sha256")
    .update(`${ip}:${process.env.AUTH_SECRET ?? "dev-secret"}`)
    .digest("hex")
    .slice(0, 32);
}

export function newToken() {
  return randomBytes(18).toString("base64url");
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
