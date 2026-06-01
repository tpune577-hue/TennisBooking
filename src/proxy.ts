import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROLES = ["super_admin", "staff"];
const SUPER_ADMIN_ONLY = ["/admin/settings"];

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Public paths — skip auth check
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/line") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/liff") ||
    pathname.startsWith("/setup") ||
    pathname === "/sign-in" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
  });

  // Unauthenticated — redirect to sign-in
  if (!token) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = (token.role as string) ?? "customer";

  // Super admin only routes
  if (SUPER_ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    if (role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && !ADMIN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)" ],
};
