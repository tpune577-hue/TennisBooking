import { z } from "zod";
import { auth } from "@/lib/auth";
import { confirmMemberPhoneOtp } from "@/lib/auth/member-verify";
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
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    await confirmMemberPhoneOtp(session.user.id, parsed.data.code);
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, session.user.id),
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
