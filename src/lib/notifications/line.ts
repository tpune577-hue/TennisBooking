const LINE_API = "https://api.line.me/v2/bot/message/push";

async function push(to: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !to) return;

  await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text }],
    }),
  }).catch((err) =>
    console.error(JSON.stringify({ level: "error", msg: "line_push_failed", error: String(err) }))
  );
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
  await push(
    opts.lineUserId,
    `✅ จองสนามสำเร็จ!\n\nรหัส: ${opts.bookingRef}\nสนาม: ${opts.courtName}\nวันที่: ${opts.date}\nเวลา: ${time}\nหักเครดิต: ${opts.totalCost} เครดิต`
  );
}

export async function notifyBookingCancelled(opts: {
  lineUserId: string;
  bookingRef: string;
  courtName: string;
  refunded: boolean;
  creditRefunded: number;
}) {
  const refundMsg = opts.refunded
    ? `\nคืนเครดิต: ${opts.creditRefunded} เครดิต`
    : `\n(ไม่คืนเครดิต เนื่องจากยกเลิกไม่ถึง 24 ชั่วโมงก่อนเวลาจอง)`;
  await push(
    opts.lineUserId,
    `❌ ยกเลิกการจองแล้ว\n\nรหัส: ${opts.bookingRef}\nสนาม: ${opts.courtName}${refundMsg}`
  );
}

export async function notifyTopupSuccess(opts: {
  lineUserId: string;
  creditAmount: number;
  newBalance: number;
}) {
  await push(
    opts.lineUserId,
    `💳 เติม Credit สำเร็จ!\n\nได้รับ: ${opts.creditAmount} เครดิต\nยอดคงเหลือ: ${opts.newBalance} เครดิต`
  );
}

export async function notifyCreditExpiringSoon(opts: {
  lineUserId: string;
  amount: number;
  daysLeft: number;
  expiresAt: string;
}) {
  await push(
    opts.lineUserId,
    `⚠️ เครดิตใกล้หมดอายุ\n\n${opts.amount} เครดิต จะหมดอายุใน ${opts.daysLeft} วัน (${opts.expiresAt})\nกรุณาใช้ก่อนหมดอายุ`
  );
}

export async function notifyCreditAdjusted(opts: {
  lineUserId: string;
  amount: number;
  newBalance: number;
  note: string;
}) {
  const changeLabel =
    opts.amount >= 0
      ? `+${opts.amount.toLocaleString()}`
      : opts.amount.toLocaleString();
  await push(
    opts.lineUserId,
    `🔔 ปรับยอดเครดิต\n\nเปลี่ยนแปลง: ${changeLabel} เครดิต\nยอดคงเหลือ: ${opts.newBalance.toLocaleString()} เครดิต\n\nหมายเหตุ: ${opts.note}`
  );
}
