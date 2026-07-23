import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "dp_session";
const PROTECTED_PREFIXES = ["/teams", "/settings"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !request.cookies.get(SESSION_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teams/:path*", "/settings/:path*"],
};
