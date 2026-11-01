import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "cynbit_recruiter";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me");
}

export async function createSession() {
  return new SignJWT({ role: "recruiter" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verifySession(token: string | undefined) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "recruiter";
  } catch {
    return false;
  }
}
