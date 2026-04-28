import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifyToken, isAuthDisabled } from "@/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
};

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAuthDisabled) return NextResponse.next();

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.svg";

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const verified = token ? verifyToken(token) : null;

  if (!verified) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    if (pathname !== "/") loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
