import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/recruiter/login") return NextResponse.next();

  const signedIn = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (signedIn) return NextResponse.next();

  const login = new URL("/recruiter/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/recruiter/:path*", "/api/resumes/:path*"],
};
