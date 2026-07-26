import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/onboarding") ||
    req.nextUrl.pathname.startsWith("/accounts") ||
    req.nextUrl.pathname.startsWith("/payments") ||
    req.nextUrl.pathname.startsWith("/cards");

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/accounts/:path*",
    "/payments/:path*",
    "/cards/:path*",
  ],
};
