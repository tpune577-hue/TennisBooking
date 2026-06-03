import { z } from "zod";
import { auth } from "@/lib/auth";
import { confirmMemberEmailOtp } from "@/lib/auth/member-verify";
import { requireSessionUserId } from "@/lib/auth/verify-api";
import { getMemberOnboardingStatus, loadReadinessColumns } from "@/lib/auth/member-readiness";
import { VerificationError } from "@/lib/auth/verification";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const session = await auth();
  const authUser = requireSessionUserId(session);
  if ("error" in authUser) {
    return Response.json({ error: authUser.error }, { status: authUser.status });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    await confirmMemberEmailOtp(authUser.userId, parsed.data.code);
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, authUser.userId),
      columns: loadReadinessColumns(),
    });
    if (!user) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({
      ok: true,
      onboarding: getMemberOnboardingStatus(user),
    });
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "ยืนยันไม่สำเร็จ" }, { status: 500 });
  }
}
