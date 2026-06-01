import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getClubAccessSettings } from "./settings";
import { getAccessWindow } from "./window";
import { accessQrPayload } from "./passes";

export type ScanInput = {
  raw: string;
  direction?: "in" | "out";
  force?: boolean;
  actorType: "staff" | "device";
  actorUserId?: string;
};

export type ScanResult = {
  ok: boolean;
  result: string;
  message: string;
  pass?: {
    id: string;
    role: string;
    presence: string;
    userName: string;
    bookingRef: string;
    courtName: string;
  };
  alert?: boolean;
};

function parseToken(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("gtc-access:")) return trimmed.slice("gtc-access:".length);
  return trimmed;
}

async function logScan(opts: {
  passId: string | null;
  bookingId: string | null;
  result: string;
  presenceBefore: string | null;
  presenceAfter: string | null;
  actorType: string;
  actorUserId?: string;
  forcedDirection?: string;
  resetPerformed?: boolean;
  reason?: string;
  message: string;
}) {
  const db = getDb();
  await db.insert(schema.accessScanEvents).values({
    passId: opts.passId,
    bookingId: opts.bookingId,
    result: opts.result,
    presenceBefore: opts.presenceBefore,
    presenceAfter: opts.presenceAfter,
    actorType: opts.actorType,
    actorUserId: opts.actorUserId ?? null,
    forcedDirection: opts.forcedDirection ?? null,
    resetPerformed: opts.resetPerformed ?? false,
    reason: opts.reason ?? null,
    message: opts.message,
  });
}

export async function performAccessScan(input: ScanInput): Promise<ScanResult> {
  const settings = await getClubAccessSettings();

  if (!settings.enabled) {
    return { ok: false, result: "system_disabled", message: "ระบบ QR ปิดอยู่" };
  }

  const token = parseToken(input.raw);
  if (!token) {
    return { ok: false, result: "invalid_token", message: "ไม่พบรหัส QR" };
  }

  const db = getDb();
  const pass = await db.query.bookingAccessPasses.findFirst({
    where: eq(schema.bookingAccessPasses.token, token),
    with: {
      user: { columns: { name: true } },
      booking: {
        with: { court: { columns: { name: true } } },
      },
    },
  });

  if (!pass) {
    return { ok: false, result: "pass_not_found", message: "ไม่พบ QR ในระบบ" };
  }

  const base = {
    pass: {
      id: pass.id,
      role: pass.role,
      presence: pass.presence,
      userName: pass.user.name,
      bookingRef: pass.booking.bookingRef,
      courtName: pass.booking.court.name,
    },
  };

  if (pass.status === "revoked") {
    const message = "QR ถูกยกเลิกแล้ว";
    await logScan({
      passId: pass.id,
      bookingId: pass.bookingId,
      result: "denied_revoked",
      presenceBefore: pass.presence,
      presenceAfter: pass.presence,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      message,
    });
    return { ok: false, result: "denied_revoked", message, ...base };
  }

  if (pass.booking.status === "cancelled") {
    const message = "การจองถูกยกเลิกแล้ว";
    await logScan({
      passId: pass.id,
      bookingId: pass.bookingId,
      result: "denied_cancelled",
      presenceBefore: pass.presence,
      presenceAfter: pass.presence,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      message,
    });
    return { ok: false, result: "denied_cancelled", message, ...base };
  }

  if (pass.booking.status !== "confirmed") {
    const message = "การจองไม่อยู่ในสถานะใช้งาน";
    await logScan({
      passId: pass.id,
      bookingId: pass.bookingId,
      result: "denied_status",
      presenceBefore: pass.presence,
      presenceAfter: pass.presence,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      message,
    });
    return { ok: false, result: "denied_status", message, ...base };
  }

  const window = getAccessWindow(pass.booking, settings);
  if (window.phase === "before") {
    const message = "ยังไม่ถึงเวลาใช้ QR";
    await logScan({
      passId: pass.id,
      bookingId: pass.bookingId,
      result: "denied_too_early",
      presenceBefore: pass.presence,
      presenceAfter: pass.presence,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      message,
    });
    return { ok: false, result: "denied_too_early", message, ...base };
  }

  if (window.phase === "after") {
    const message = "หมดเวลาใช้ QR แล้ว";
    await logScan({
      passId: pass.id,
      bookingId: pass.bookingId,
      result: "denied_expired",
      presenceBefore: pass.presence,
      presenceAfter: pass.presence,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      message,
    });
    return { ok: false, result: "denied_expired", message, ...base };
  }

  let targetPresence: "inside" | "outside";
  if (input.force && input.direction) {
    targetPresence = input.direction === "in" ? "inside" : "outside";
  } else if (input.direction === "in") {
    targetPresence = "inside";
  } else if (input.direction === "out") {
    targetPresence = "outside";
  } else {
    targetPresence = pass.presence === "outside" ? "inside" : "outside";
  }

  if (pass.presence === "inside" && targetPresence === "inside") {
    const message = "อยู่ในสนามแล้ว — รอสแกนออก หรือให้ staff Reset";
    await logScan({
      passId: pass.id,
      bookingId: pass.bookingId,
      result: "denied_already_inside",
      presenceBefore: pass.presence,
      presenceAfter: pass.presence,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      message,
    });
    return {
      ok: false,
      result: "denied_already_inside",
      message,
      alert: true,
      ...base,
    };
  }

  if (pass.presence === "outside" && targetPresence === "outside" && input.direction === "out") {
    const message = "ยังไม่ได้เข้าสนาม";
    await logScan({
      passId: pass.id,
      bookingId: pass.bookingId,
      result: "denied_not_inside",
      presenceBefore: pass.presence,
      presenceAfter: pass.presence,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      forcedDirection: input.direction,
      message,
    });
    return { ok: false, result: "denied_not_inside", message, ...base };
  }

  const now = new Date();
  await db
    .update(schema.bookingAccessPasses)
    .set({ presence: targetPresence, updatedAt: now })
    .where(eq(schema.bookingAccessPasses.id, pass.id));

  const result = targetPresence === "inside" ? "allowed_in" : "allowed_out";
  const message =
    targetPresence === "inside"
      ? `เข้าสนาม — ${pass.user.name}`
      : `ออกจากสนาม — ${pass.user.name}`;

  await logScan({
    passId: pass.id,
    bookingId: pass.bookingId,
    result,
    presenceBefore: pass.presence,
    presenceAfter: targetPresence,
    actorType: input.actorType,
    actorUserId: input.actorUserId,
    forcedDirection: input.force ? input.direction : undefined,
    message,
  });

  return {
    ok: true,
    result,
    message,
    pass: { ...base.pass, presence: targetPresence },
  };
}

export { accessQrPayload };
