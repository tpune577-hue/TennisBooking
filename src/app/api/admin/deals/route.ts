import { auth } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { notifyDealOffer } from "@/lib/notifications/line";
import { sendDealOfferEmail } from "@/lib/email/send-deal-offer";
import { formatDealBonusPercent } from "@/lib/deals/bonus-percent";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "staff"];

const createDealSchema = z
  .object({
    userId: z.string().uuid(),
    priceThb: z.number().int().min(1),
    creditAmount: z.number().int().min(1),
    expiresAt: z.string().datetime(),
    sendLine: z.boolean(),
    sendEmail: z.boolean(),
  })
  .refine((d) => d.sendLine || d.sendEmail, {
    message: "เลือกช่องทางส่งอย่างน้อย 1 ช่องทาง",
  })
  .refine((d) => d.creditAmount >= d.priceThb, {
    message: "เครดิตต้องมากกว่าหรือเท่ากับราคา",
  });

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const db = getDb();
    const offers = await db.query.dealOffers.findMany({
      where: status
        ? eq(schema.dealOffers.status, status as "non_paid" | "paid" | "expired" | "cancelled")
        : undefined,
      orderBy: [desc(schema.dealOffers.createdAt)],
      limit: 200,
      with: {
        user: {
          columns: { id: true, name: true, email: true, lineUserId: true },
        },
      },
    });

    return Response.json(offers);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "admin_deals_list_failed", error: String(err) }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const start = Date.now();
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const adminId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const parsed = createDealSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, priceThb, creditAmount, expiresAt, sendLine, sendEmail } = parsed.data;
    const expiresDate = new Date(expiresAt);
    if (expiresDate <= new Date()) {
      return Response.json({ error: "วันหมดอายุต้องอยู่ในอนาคต" }, { status: 400 });
    }

    const db = getDb();
    const [member] = await db
      .select({
        lineUserId: schema.users.lineUserId,
        email: schema.users.email,
        name: schema.users.name,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!member) {
      return Response.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    }

    if (sendLine && !member.lineUserId) {
      return Response.json({ error: "สมาชิกไม่มี LINE — ยกเลิกการเลือก LINE หรือเลือกสมาชิกอื่น" }, { status: 400 });
    }
    if (sendEmail && !member.email) {
      return Response.json({ error: "สมาชิกไม่มีอีเมล — ยกเลิกการเลือก Email หรือเลือกสมาชิกอื่น" }, { status: 400 });
    }

    const now = new Date();
    const [offer] = await db
      .insert(schema.dealOffers)
      .values({
        userId,
        priceThb,
        creditAmount,
        expiresAt: expiresDate,
        status: "non_paid",
        sentViaLine: sendLine,
        sentViaEmail: sendEmail,
        sentAt: now,
        createdBy: adminId,
      })
      .returning();

    const expireLabel = expiresDate.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const bonusLabel = formatDealBonusPercent(priceThb, creditAmount);

    const lineNotification: { sent: boolean; reason?: string } = { sent: false, reason: "not_requested" };
    const emailNotification: { sent: boolean; reason?: string } = { sent: false, reason: "not_requested" };

    if (sendLine && member.lineUserId) {
      const pushResult = await notifyDealOffer({
        lineUserId: member.lineUserId,
        offerId: offer.id,
        priceThb,
        creditAmount,
        bonusLabel,
        expiresAt: expireLabel,
      });
      lineNotification.sent = pushResult.ok;
      if (!pushResult.ok) {
        lineNotification.reason = pushResult.reason;
      }
    }

    if (sendEmail && member.email) {
      try {
        await sendDealOfferEmail({
          email: member.email,
          offerId: offer.id,
          priceThb,
          creditAmount,
          expiresAt: expiresDate,
        });
        emailNotification.sent = true;
        emailNotification.reason = undefined;
      } catch (err) {
        emailNotification.reason = String(err);
        console.error(JSON.stringify({ level: "error", msg: "deal_email_failed", offerId: offer.id, error: String(err) }));
      }
    }

    console.log(JSON.stringify({ level: "info", msg: "deal_created", offerId: offer.id, ms: Date.now() - start }));
    return Response.json({ offer, lineNotification, emailNotification }, { status: 201 });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "admin_deals_create_failed", error: String(err), ms: Date.now() - start }));
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
