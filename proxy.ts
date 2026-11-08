import { NextResponse, type NextRequest } from "next/server";
import { OWNER_SESSION_COOKIE, verifyOwnerSession } from "@/lib/auth/token";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(OWNER_SESSION_COOKIE)?.value;
  if (!verifyOwnerSession(sessionToken)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/analytics/:path*",
    "/applications/:path*",
    "/calendar/:path*",
    "/companies/:path*",
    "/dashboard/:path*",
    "/documents/:path*",
    "/pipeline/:path*",
    "/settings/:path*",
  ],
};