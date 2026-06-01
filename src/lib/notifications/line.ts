import { formatBookingSlotTh } from "@/lib/bookings/format-slot";

const LINE_API = "https://api.line.me/v2/bot/message/push";

const COLORS = {
  success: "#16A34A",
  cancel: "#DC2626",
  muted: "#6B7280",
  warning: "#D97706",
} as const;

export type LinePushResult =
  | { ok: true }
  | { ok: false; reason: "missing_token" | "missing_recipient" | "http_error" | "network_error"; status?: number; detail?: string };

type FlexComponent = Record<string, unknown>;
type FlexBubble = {
  type: "bubble";
  header?: FlexComponent;
  body: FlexComponent;
  footer?: FlexComponent;
};

function flexRow(label: string, value: string): FlexComponent {
  return {
    type: "box",
    layout: "baseline",
    spacing: "sm",
    contents: [
      { type: "text", text: label, color: "#8C8C8C", size: "sm", flex: 2 },
      { type: "text", text: value, wrap: true, size: "sm", flex: 5 },
    ],
  };
}

function flexHeader(title: string, backgroundColor: string): FlexComponent {
  return {
    type: "box",
    layout: "vertical",
    contents: [{ type: "text", text: title, weight: "bold", size: "lg", color: "#FFFFFF" }],
    backgroundColor,
    paddingAll: "16px",
  };
}

function flexBody(rows: FlexComponent[]): FlexComponent {
  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: rows,
    paddingAll: "16px",
  };
}

function flexFooterButton(label: string, uri: string): FlexComponent {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "button",
        style: "primary",
        color: COLORS.warning,
        action: { type: "uri", label, uri },
      },
    ],
    paddingAll: "12px",
  };
}

function liffTopupUri(): string {
  const base = process.env.AUTH_URL?.replace(/\/$/, "");
  if (base) return `${base}/liff/topup`;
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId) return `https://liff.line.me/${liffId}`;
  return "/liff/topup";
}

async function pushMessages(to: string, messages: unknown[]): Promise<LinePushResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error(JSON.stringify({ level: "error", msg: "line_push_skipped", reason: "missing LINE_CHANNEL_ACCESS_TOKEN" }));
    return { ok: false, reason: "missing_token" };
  }
  if (!to) {
    console.error(JSON.stringify({ level: "error", msg: "line_push_skipped", reason: "missing lineUserId" }));
    return { ok: false, reason: "missing_recipient" };
  }

  try {
    const res = await fetch(LINE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to, messages }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        JSON.stringify({
          level: "error",
          msg: "line_push_failed",
          status: res.status,
          body,
          to,
        })
      );
      return { ok: false, reason: "http_error", status: res.status, detail: body };
    }

    console.log(JSON.stringify({ level: "info", msg: "line_push_ok", to }));
    return { ok: true };
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "line_push_failed", error: String(err) }));
    return { ok: false, reason: "network_error", detail: String(err) };
  }
}

async function pushFlex(to: string, altText: string, contents: FlexBubble): Promise<LinePushResult> {
  return pushMessages(to, [{ type: "flex", altText, contents }]);
}

async function pushText(to: string, text: string): Promise<LinePushResult> {
  return pushMessages(to, [{ type: "text", text }]);
}

export async function notifyBookingConfirmed(opts: {
  lineUserId: string;
  bookingRef: string;
  courtName: string;
  date: string;
  startHour: number;
  endHour: number;
  totalCost: number;
}) {
  const time = `${String(opts.startHour).padStart(2, "0")}:00 – ${String(opts.endHour).padStart(2, "0")}:00`;
  const altText = "จองสนามสำเร็จ!";
  await pushFlex(opts.lineUserId, altText, {
    type: "bubble",
    header: flexHeader("✅ จองสนามสำเร็จ!", COLORS.success),
    body: flexBody([
      flexRow("รหัส", opts.bookingRef),
      flexRow("สนาม", opts.courtName),
      flexRow("วันที่", opts.date),
      flexRow("เวลา", time),
      flexRow("หักเครดิต", `${opts.totalCost.toLocaleString()} เครดิต`),
    ]),
  });
}

function bookingCancelledBubble(opts: {
  headerTitle: string;
  headerColor: string;
  bookingRef: string;
  courtName: string;
  slot: string;
  refundLabel: string;
  refundValue: string;
}): FlexBubble {
  return {
    type: "bubble",
    header: flexHeader(opts.headerTitle, opts.headerColor),
    body: flexBody([
      flexRow("รหัส", opts.bookingRef),
      flexRow("สนาม", opts.courtName),
      flexRow("วันเวลา", opts.slot.replace(/\n/g, " · ")),
      flexRow(opts.refundLabel, opts.refundValue),
    ]),
  };
}

/** Member self-cancel (24h policy messaging). */
export async function notifyBookingCancelled(opts: {
  lineUserId: string;
  bookingRef: string;
  courtName: string;
  startTime: Date;
  endTime: Date;
  refunded: boolean;
  creditRefunded: number;
}) {
  const refundValue = opts.refunded
    ? `${opts.creditRefunded.toLocaleString()} เครดิต`
    : "ไม่คืนเครดิต (ยกเลิกไม่ถึง 24 ชม. ก่อนเวลาจอง)";

  await pushFlex(
    opts.lineUserId,
    "ยกเลิกการจองแล้ว",
    bookingCancelledBubble({
      headerTitle: "❌ ยกเลิกการจองแล้ว",
      headerColor: opts.refunded ? COLORS.muted : COLORS.cancel,
      bookingRef: opts.bookingRef,
      courtName: opts.courtName,
      slot: formatBookingSlotTh(opts.startTime, opts.endTime),
      refundLabel: "คืนเครดิต",
      refundValue,
    })
  );
}

/** Booking owner — admin or club-initiated cancel. */
export async function notifyBookingCancelledOwner(opts: {
  lineUserId: string;
  bookingRef: string;
  courtName: string;
  startTime: Date;
  endTime: Date;
  refunded: boolean;
  creditRefunded: number;
}) {
  const refundValue = opts.refunded
    ? `${opts.creditRefunded.toLocaleString()} เครดิต`
    : "ไม่มีการคืนเครดิต";

  await pushFlex(
    opts.lineUserId,
    "การจองของคุณถูกยกเลิก",
    bookingCancelledBubble({
      headerTitle: "❌ การจองถูกยกเลิก",
      headerColor: COLORS.cancel,
      bookingRef: opts.bookingRef,
      courtName: opts.courtName,
      slot: formatBookingSlotTh(opts.startTime, opts.endTime),
      refundLabel: "คืนเครดิต",
      refundValue,
    })
  );
}

/** Guest who accepted an invite — slot info only, no credit wording. */
export async function notifyBookingCancelledGuest(opts: {
  lineUserId: string;
  bookingRef: string;
  courtName: string;
  startTime: Date;
  endTime: Date;
  hostName: string;
}) {
  await pushFlex(opts.lineUserId, "การจองที่คุณได้รับเชิญถูกยกเลิก", {
    type: "bubble",
    header: flexHeader("❌ การจองถูกยกเลิก", COLORS.cancel),
    body: flexBody([
      flexRow("รหัส", opts.bookingRef),
      flexRow("สนาม", opts.courtName),
      flexRow("วันเวลา", formatBookingSlotTh(opts.startTime, opts.endTime).replace(/\n/g, " · ")),
      flexRow("เจ้าของการจอง", opts.hostName),
    ]),
  });
}

export async function notifyTopupSuccess(opts: {
  lineUserId: string;
  creditAmount: number;
  newBalance: number;
}) {
  await pushFlex(opts.lineUserId, "เติมเครดิตสำเร็จ", {
    type: "bubble",
    header: flexHeader("💳 เติมเครดิตสำเร็จ!", COLORS.success),
    body: flexBody([
      flexRow("ได้รับ", `${opts.creditAmount.toLocaleString()} เครดิต`),
      flexRow("ยอดคงเหลือ", `${opts.newBalance.toLocaleString()} เครดิต`),
    ]),
  });
}

export async function notifyCreditExpiringSoon(opts: {
  lineUserId: string;
  amount: number;
  daysLeft: number;
  expiresAt: string;
}) {
  await pushFlex(opts.lineUserId, "เครดิตใกล้หมดอายุ", {
    type: "bubble",
    header: flexHeader("⚠️ เครดิตใกล้หมดอายุ", COLORS.warning),
    body: flexBody([
      flexRow("จำนวน", `${opts.amount.toLocaleString()} เครดิต`),
      flexRow("เหลือเวลา", `${opts.daysLeft} วัน`),
      flexRow("หมดอายุ", opts.expiresAt),
    ]),
    footer: flexFooterButton("เติมเครดิต", liffTopupUri()),
  });
}

export async function notifyCreditAdjusted(opts: {
  lineUserId: string;
  amount: number;
  newBalance: number;
  note: string;
}): Promise<LinePushResult> {
  const changeLabel =
    opts.amount >= 0 ? `+${opts.amount.toLocaleString()}` : opts.amount.toLocaleString();
  return pushText(
    opts.lineUserId,
    `🔔 ปรับยอดเครดิต\n\nเปลี่ยนแปลง: ${changeLabel} เครดิต\nยอดคงเหลือ: ${opts.newBalance.toLocaleString()} เครดิต\n\nหมายเหตุ: ${opts.note}`
  );
}
