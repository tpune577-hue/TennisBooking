import { auth } from "@/lib/auth";
import { performAccessScan } from "@/lib/access/scan";
import { isStaffRole, verifyDeviceApiKey } from "@/lib/access/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(1),
  direction: z.enum(["in", "out"]).optional(),
  force: z.boolean().optional(),
});

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  let actorType: "staff" | "device";
  let actorUserId: string | undefined;

  if (verifyDeviceApiKey(authHeader)) {
    actorType = "device";
  } else if (session?.user && role && isStaffRole(role)) {
    actorType = "staff";
    actorUserId = (session.user as { id: string }).id;
  } else {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await performAccessScan({
    raw: parsed.data.token,
    direction: parsed.data.direction,
    force: parsed.data.force,
    actorType,
    actorUserId,
  });

  return Response.json(result, { status: result.ok ? 200 : 422 });
}
