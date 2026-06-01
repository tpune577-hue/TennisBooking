import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

// Lightweight NextAuth instance for proxy — no DB adapter, JWT-only session read
const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    session({ session, token }) {
      if (token.role) (session.user as unknown as Record<string, unknown>).role = token.role;
      return session;
    },
  },
});

const ADMIN_ROLES = ["super_admin", "staff"];
const SUPER_ADMIN_ONLY = ["/admin/settings"];

async function middleware(
  req: NextRequest & { auth: Session | null }
): Promise<Response> {
  const pathname = req.nextUrl.pathname;

  // Public paths — no auth required
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/line") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/liff") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/api/invites/") ||
    pathname.startsWith("/setup") ||
    pathname === "/sign-in" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Unauthenticated — redirect to sign-in
  if (!req.auth?.user) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = ((req.auth.user as unknown as Record<string, unknown>).role as string) ?? "customer";

  // Super-admin-only routes
  if (SUPER_ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin routes
  if (pathname.startsWith("/admin") && !ADMIN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const proxy = auth(middleware as any);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)" ],
};
