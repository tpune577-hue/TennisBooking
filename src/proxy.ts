import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { isProfileComplete, loadReadinessColumns } from "@/lib/auth/member-readiness";

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

function isPublicPath(pathname: string): boolean {
  const isPublicMarketing =
    pathname === "/" ||
    pathname === "/courts" ||
    pathname === "/coaches" ||
    pathname === "/booking" ||
    pathname === "/contact" ||
    pathname === "/privacy" ||
    pathname === "/terms";

  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/line") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/api/invites/") ||
    pathname === "/setup" ||
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    pathname === "/sign-up" ||
    pathname === "/complete-profile" ||
    pathname.startsWith("/club/") ||
    isPublicMarketing
  );
}

async function middleware(
  req: NextRequest & { auth: Session | null }
): Promise<Response> {
  const pathname = req.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // LIFF must load without a session so the client can run LINE → NextAuth bridge
  if (pathname.startsWith("/liff") && !req.auth?.user) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = ((req.auth.user as unknown as Record<string, unknown>).role as string) ?? "customer";
  const userId = (req.auth.user as { id?: string }).id;

  if (
    userId &&
    role === "customer" &&
    pathname !== "/complete-profile" &&
    !pathname.startsWith("/liff") &&
    !pathname.startsWith("/api/")
  ) {
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: loadReadinessColumns(),
    });
    if (user && !isProfileComplete(user)) {
      const completeUrl = new URL("/complete-profile", req.url);
      if (pathname.startsWith("/liff") || pathname.startsWith("/dashboard")) {
        completeUrl.searchParams.set("callbackUrl", pathname);
      }
      return NextResponse.redirect(completeUrl);
    }
  }

  if (SUPER_ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/admin") && !ADMIN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const proxy = auth(middleware as any);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
