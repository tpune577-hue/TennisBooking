import NextAuth, { type NextAuthResult, type Session } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, schema } from "@/db";
import { authConfig } from "./config";
import { eq } from "drizzle-orm";

// Lazily create the NextAuth instance so getDb() (and thus neon()) is only
// called when the first real HTTP request arrives, not at module evaluation time.
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

        // Refresh user data from DB on sign-in OR when session.update() is called
        if ((account?.provider === "line" && user?.id) || trigger === "update") {
          const id = (user?.id ?? token.id) as string | undefined;
          if (id) {
            const db = getDb();
            const dbUser = await db.query.users.findFirst({
              where: eq(schema.users.id, id),
              columns: { role: true, tierId: true, creditBalance: true, lineUserId: true },
            });
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

        const db = getDb();
        const lineUserId = account.providerAccountId;

        const existing = await db.query.users.findFirst({
          where: eq(schema.users.lineUserId, lineUserId),
        });

        if (!existing) {
          const defaultTier = await db.query.tiers.findFirst({
            where: eq(schema.tiers.name, "Regular"),
          });

          await db
            .update(schema.users)
            .set({
              lineUserId,
              name: profile?.name ?? user.name ?? "User",
              avatarUrl: (profile as { pictureUrl?: string })?.pictureUrl ?? user.image ?? null,
              tierId: defaultTier?.id ?? null,
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, user.id!));
        }

        return true;
      },
    },
  });

  return _instance;
}

// Lazy wrappers — no DB call happens until first request
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
