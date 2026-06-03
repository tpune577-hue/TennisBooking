import NextAuth, { type NextAuthResult, type Session } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, schema } from "@/db";
import { authConfig } from "./config";
import { eq } from "drizzle-orm";
import {
  assertLineSignInAllowed,
  cleanupRejectedOAuthUser,
  linkLineToUser,
} from "./line-sign-in";
import { loadUserForSession } from "./users";

let _instance: NextAuthResult | null = null;

function getInstance(): NextAuthResult {
  if (_instance) return _instance;

  _instance = NextAuth({
    ...authConfig,
    adapter: DrizzleAdapter(getDb(), {
      usersTable: schema.users as never,
      accountsTable: schema.accounts as never,
    }),
    session: { strategy: "jwt" },
    callbacks: {
      ...authConfig.callbacks,
      async jwt({ token, user, account, trigger }) {
        if (user) {
          token.id = user.id;
          token.role = (user as { role?: string }).role ?? "customer";
        }

        const shouldRefresh =
          account?.provider === "line" ||
          account?.provider === "credentials" ||
          trigger === "update";

        if (shouldRefresh) {
          const id = (user?.id ?? token.id) as string | undefined;
          if (id) {
            const dbUser = await loadUserForSession(id);
            if (dbUser) {
              token.role = dbUser.role;
              token.tierId = dbUser.tierId;
              token.creditBalance = dbUser.creditBalance;
              token.lineUserId = dbUser.lineUserId;
            }
          }
        }

        return token;
      },
      async session({ session, token }) {
        if (token) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.tierId = token.tierId as string | null;
          session.user.creditBalance = token.creditBalance as number;
          session.user.lineUserId = token.lineUserId as string | null;
        }
        return session;
      },
      async signIn({ user, account, profile }) {
        if (account?.provider !== "line") return true;
        if (!user.id || !account.providerAccountId) return false;

        const check = await assertLineSignInAllowed({
          userId: user.id,
          lineProviderAccountId: account.providerAccountId,
          profileEmail: (profile as { email?: string })?.email ?? user.email,
        });

        if (!check.ok) {
          await cleanupRejectedOAuthUser(user.id);
          return `/sign-in?error=${encodeURIComponent(check.reason)}`;
        }

        await linkLineToUser({
          userId: user.id,
          lineUserId: account.providerAccountId,
          name: profile?.name ?? user.name ?? "User",
          avatarUrl: (profile as { pictureUrl?: string })?.pictureUrl ?? user.image ?? null,
        });

        return true;
      },
    },
  });

  return _instance;
}

export const handlers = {
  GET: (...args: Parameters<NextAuthResult["handlers"]["GET"]>) =>
    getInstance().handlers.GET(...args),
  POST: (...args: Parameters<NextAuthResult["handlers"]["POST"]>) =>
    getInstance().handlers.POST(...args),
};

export async function auth(): Promise<Session | null> {
  return (getInstance().auth as () => Promise<Session | null>)();
}

export async function signIn(provider?: string, options?: Record<string, unknown>) {
  return getInstance().signIn(provider as never, options as never);
}

export async function signOut(options?: Record<string, unknown>) {
  return getInstance().signOut(options as never);
}
