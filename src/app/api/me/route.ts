import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import {
  getMemberFieldLocks,
  getMemberOnboardingStatus,
  isProfileComplete,
  loadReadinessColumns,
} from "@/lib/auth/member-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.user.id),
    columns: {
      creditBalance: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      ...loadReadinessColumns(),
    },
    with: {
      tier: { columns: { name: true, discountPercent: true } },
    },
  });

  if (!user) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const onboarding = getMemberOnboardingStatus(user);

  return Response.json({
    creditBalance: user.creditBalance,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    tier: user.tier
      ? { name: user.tier.name, discountPercent: user.tier.discountPercent }
      : null,
    profileComplete: isProfileComplete(user),
    onboarding,
    fieldLocks: getMemberFieldLocks(user),
    lineDisplayName: user.lineUserId ? user.name : null,
  });
}
