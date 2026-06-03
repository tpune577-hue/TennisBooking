import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { VerificationError } from "@/lib/auth/verification";
import { completeMemberProfile, completeProfileSchema } from "@/lib/auth/signup";
import { isProfileComplete, loadReadinessColumns } from "@/lib/auth/member-readiness";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = completeProfileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "ข้อมูลไม่ครบหรือไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    await completeMemberProfile(session.user.id, parsed.data);
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, session.user.id),
      columns: loadReadinessColumns(),
    });
    if (!user) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ ok: true, profileComplete: isProfileComplete(user) });
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
