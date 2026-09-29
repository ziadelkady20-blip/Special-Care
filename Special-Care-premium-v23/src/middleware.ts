import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/cases",
  "/follow-ups",
  "/reports",
  "/users",
  "/settings",
  "/audit",
  "/admin",
  "/intake",
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (!token) return NextResponse.next();
    const accountType = (token as any).u?.accountType;
    const path = req.nextUrl.pathname;
    const role = (token as any).u?.role;
    if (accountType === "PARENT" && !path.startsWith("/parent") && !path.startsWith("/centers")) {
      return NextResponse.redirect(new URL("/parent", req.url));
    }
    if (accountType === "CENTER" && path.startsWith("/parent")) {
      return NextResponse.redirect(new URL(role === "SUPER_ADMIN" ? "/admin/platform" : "/dashboard", req.url));
    }
    if (accountType === "PARENT" && (path.startsWith("/intake") || path.startsWith("/admin") || path.startsWith("/dashboard") || path.startsWith("/cases") || path.startsWith("/follow-ups") || path.startsWith("/reports") || path.startsWith("/users") || path.startsWith("/settings") || path.startsWith("/audit"))) {
      return NextResponse.redirect(new URL("/parent", req.url));
    }
    if (accountType === "CENTER" && path.startsWith("/intake") && role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/platform", req.url));
    }
    if (path.startsWith("/admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!token) return false;
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cases/:path*",
    "/follow-ups/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/audit/:path*",
    "/parent/:path*",
    "/admin/:path*",
    "/intake/:path*",
  ],
};
