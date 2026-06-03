import type { Session } from "next-auth";
import { isVerificationLogOnlyMode } from "./verification-delivery";
import { getSessionUserId } from "./session-user-id";

export function requireSessionUserId(
  session: Session | null,
): { userId: string } | { error: string; status: number } {
  const userId = getSessionUserId(session);
  if (!userId) {
    return {
      error: "เซสชันไม่สมบูรณ์ — ออกจากระบบแล้วเข้าใหม่",
      status: 401,
    };
  }
  return { userId };
}

export function verifySendResponse(code: string) {
  const body: { ok: true; devCode?: string } = { ok: true };
  if (isVerificationLogOnlyMode()) {
    body.devCode = code;
  }
  return body;
}

export function verifyRouteError(err: unknown, fallback: string) {
  console.error("[verify]", err);
  const message = err instanceof Error ? err.message : fallback;
  return Response.json({ error: message }, { status: 500 });
}
