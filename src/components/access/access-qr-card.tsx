"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Loader2, MapPin } from "lucide-react";

type PassMeResponse = {
  pass: {
    role: string;
    status: string;
    presence: string;
    qrPayload: string;
  };
  booking: {
    ref: string;
    courtName: string;
    status: string;
  };
  window: {
    phase: "before" | "active" | "after";
    validFrom: string;
    validUntil: string;
    label: string;
  };
  settings: { enabled: boolean };
};

export function AccessQrCard({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<PassMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/access/passes/me?bookingId=${bookingId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
        setData(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => {
    if (!data?.pass.qrPayload || data.window.phase !== "active") {
      setQrUrl(null);
      return;
    }
    QRCode.toDataURL(data.pass.qrPayload, { width: 260, margin: 2 }).then(setQrUrl);
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive text-center py-6">{error ?? "ไม่พบ QR"}</p>
    );
  }

  if (!data.settings.enabled) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        ระบบ QR เข้าสนามปิดอยู่ — กรุณาติดต่อเคาน์เตอร์
      </p>
    );
  }

  if (data.pass.status === "revoked") {
    return (
      <p className="text-sm text-destructive text-center py-6">QR ถูกยกเลิกแล้ว</p>
    );
  }

  const opensAt = new Date(data.window.validFrom);

  if (data.window.phase === "before") {
    return (
      <div className="text-center space-y-2 py-6">
        <p className="font-semibold">QR ยังไม่เปิดใช้งาน</p>
        <p className="text-sm text-muted-foreground">
          ใช้ได้ตั้งแต่{" "}
          {new Intl.DateTimeFormat("th-TH", {
            timeZone: "Asia/Bangkok",
            dateStyle: "medium",
            timeStyle: "short",
          }).format(opensAt)}
        </p>
        <p className="text-xs text-muted-foreground">{data.window.label}</p>
      </div>
    );
  }

  if (data.window.phase === "after") {
    return (
      <div className="text-center space-y-2 py-6">
        <p className="font-semibold text-destructive">QR หมดอายุแล้ว</p>
        <p className="text-xs text-muted-foreground">{data.window.label}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center space-y-1">
        <p className="font-mono font-bold text-lg">{data.booking.ref}</p>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {data.booking.courtName}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {data.pass.role === "host"
            ? "เจ้าของการจอง"
            : data.pass.role === "guest"
              ? "แขก"
              : "โค้ช"}
          · {data.pass.presence === "inside" ? "อยู่ในสนาม" : "อยู่นอกสนาม"}
        </p>
      </div>

      {qrUrl ? (
        <div className="bg-white p-3 rounded-xl shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR เข้าสนาม" width={260} height={260} />
        </div>
      ) : (
        <Loader2 className="h-8 w-8 animate-spin" />
      )}

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        แสดง QR นี้ที่ประตู — ห้ามแชร์ภาพหน้าจอขณะอยู่ในสนาม
      </p>
    </div>
  );
}
