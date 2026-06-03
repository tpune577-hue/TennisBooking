import type { Session } from "next-auth";

/** JWT session must expose user id for /api/me/* routes. */
export function getSessionUserId(session: Session | null): string | undefined {
  if (!session?.user) return undefined;
  const u = session.user as { id?: string; sub?: string };
  return u.id ?? u.sub;
}
