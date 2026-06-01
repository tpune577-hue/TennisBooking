"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CancelBookingTarget = {
  id: string;
  bookingRef: string;
  courtName: string;
  startTime: string;
  totalCreditCost: number;
};

type Props = {
  booking: CancelBookingTarget | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
};

function formatDt(s: string) {
  const d = new Date(s);
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function CancelBookingDialog({ booking, onClose, onSuccess }: Props) {
  const [refundCredits, setRefundCredits] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!booking) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundCredits }),
      });
      const data = await res.json();
      if (!res.ok) {
        onSuccess(data.error ?? "ยกเลิกไม่สำเร็จ");
        return;
      }
      const refundPart = data.refunded
        ? ` คืน ${data.creditRefunded?.toLocaleString() ?? booking.totalCreditCost} เครดิต`
        : " ไม่คืนเครดิต";
      const guestPart =
        data.guestsNotified > 0 ? ` แจ้ง guest ${data.guestsNotified} คน` : "";
      onSuccess(`ยกเลิกสำเร็จ ·${refundPart}${guestPart}`);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ยกเลิกการจอง — {booking?.bookingRef}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm">
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <p>
              <span className="text-muted-foreground">สนาม </span>
              {booking?.courtName}
            </p>
            <p>
              <span className="text-muted-foreground">เวลา </span>
              {booking ? formatDt(booking.startTime) : ""}
            </p>
            <p>
              <span className="text-muted-foreground">เครดิตที่จอง </span>
              {booking?.totalCreditCost.toLocaleString()}
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border"
              checked={refundCredits}
              onChange={(e) => setRefundCredits(e.target.checked)}
            />
            <div>
              <span className="font-medium">คืนเครดิตให้เจ้าของการจอง</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                ถ้าไม่เลือก ระบบจะแจ้งเจ้าของและ guest ว่าการจองถูกยกเลิกโดยไม่คืนเครดิต
              </p>
            </div>
          </label>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
            <Button
              variant="destructive"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
