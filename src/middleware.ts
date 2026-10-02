// src/middleware.ts
// Coarse gate: you must be signed in to reach the dashboards, and only admins reach /admin.
// This is only the first line of defence — every page and API route ALSO checks the
// user's real, current account status in the database (see lib/session.ts).

import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    if (req.nextUrl.pathname.startsWith("/admin") && req.nextauth.token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    // Middleware doesn't read authOptions, so the sign-in page must be repeated here.
    pages: { signIn: "/login" },
    callbacks: { authorized: ({ token }) => !!token },
  },
);

export const config = { matcher: ["/seller/:path*", "/buyer/:path*", "/admin/:path*"] };
