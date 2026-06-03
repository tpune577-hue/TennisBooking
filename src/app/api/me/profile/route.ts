import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { VerificationError } from "@/lib/auth/verification";
import {
  completeMemberProfile,
  completeProfileSchema,
} from "@/lib/auth/signup";
import {
  memberContactPatchSchema,
  patchMemberContact,
} from "@/lib/auth/member-contact";
import {
  getMemberOnboardingStatus,
  isProfileComplete,
  loadReadinessColumns,
} from "@/lib/auth/member-readiness";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const isFullProfile =
    typeof body === "object" &&
    body !== null &&
    "dateOfBirth" in body &&
    "gender" in body;

  try {
    const db = getDb();
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.id, session.user.id),
      columns: loadReadinessColumns(),
    });
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (isFullProfile) {
      const parsed = completeProfileSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "ข้อมูลไม่ครบหรือไม่ถูกต้อง" }, { status: 400 });
      }
      await completeMemberProfile(session.user.id, parsed.data);
    } else {
      const parsed = memberContactPatchSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }
      await patchMemberContact(session.user.id, parsed.data, existing);
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, session.user.id),
      columns: loadReadinessColumns(),
    });
    if (!user) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({
      ok: true,
      profileComplete: isProfileComplete(user),
      onboarding: getMemberOnboardingStatus(user),
    });
  } catch (err) {
    if (err instanceof VerificationError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
