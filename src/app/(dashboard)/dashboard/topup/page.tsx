"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, QrCode, CreditCard, AlertCircle } from "lucide-react";

const PACKAGES = [
  { thb: 500,  credits: 500,  label: "500 บาท",  bonus: 0 },
  { thb: 1000, credits: 1100, label: "1,000 บาท", bonus: 100 },
  { thb: 2000, credits: 2400, label: "2,000 บาท", bonus: 400 },
  { thb: 5000, credits: 6000, label: "5,000 บาท", bonus: 1000 },
] as const;

type Step = "select" | "method" | "qr" | "success" | "failed";

export default function TopupPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment(method: "promptpay" | "credit_card") {
    if (selected === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageIndex: selected, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }
      setPaymentId(data.paymentId);

      if (method === "promptpay") {
        setQrUrl(data.qrImageUrl);
        setStep("qr");
        pollStatus(data.paymentId);
      } else {
        if (data.status === "successful" || data.status === "paid") {
          setStep("success");
        } else {
          setStep("failed");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function pollStatus(id: string) {
    setPolling(true);
    const maxAttempts = 60; // 5 minutes at 5s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch(`/api/payments/${id}/status`);
        const data = await res.json();
        if (data.status === "paid") {
          setStep("success");
          setPolling(false);
          return;
        }
        if (data.status === "failed") {
          setStep("failed");
          setPolling(false);
          return;
        }
      } catch {
        // ignore network errors during polling
      }
    }
    setPolling(false);
    setError("หมดเวลา กรุณาตรวจสอบยอดเครดิตในหน้า เครดิตของฉัน");
  }

  const pkg = selected !== null ? PACKAGES[selected] : null;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold text-foreground">เติมเครดิต</h1>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 p-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step: select package */}
      {step === "select" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">เลือก Package ที่ต้องการ</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PACKAGES.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  selected === i
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">{p.label}</span>
                  {selected === i && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-2xl font-bold text-foreground">{p.credits.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">เครดิต</div>
                {p.bonus > 0 && (
                  <Badge className="mt-2 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                    +{p.bonus} โบนัส
                  </Badge>
                )}
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            disabled={selected === null}
            onClick={() => setStep("method")}
          >
            ดำเนินการต่อ
          </Button>
        </div>
      )}

      {/* Step: choose method */}
      {step === "method" && pkg && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Package ที่เลือก</p>
            <p className="font-semibold text-foreground">{pkg.label} → {pkg.credits.toLocaleString()} เครดิต</p>
          </div>
          <p className="text-sm text-muted-foreground">เลือกวิธีชำระเงิน</p>
          <div className="grid gap-3">
            <button
              onClick={() => startPayment("promptpay")}
              disabled={loading}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-all text-left"
            >
              <QrCode className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground">PromptPay QR</p>
                <p className="text-xs text-muted-foreground">สแกน QR Code จ่ายผ่านแอปธนาคาร</p>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
            </button>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setStep("select")}>
            ← เลือก Package ใหม่
          </Button>
        </div>
      )}

      {/* Step: QR code */}
      {step === "qr" && pkg && (
        <div className="space-y-4 text-center">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <p className="font-semibold text-foreground">สแกน QR Code เพื่อชำระเงิน</p>
            <p className="text-muted-foreground text-sm">{pkg.label} → {pkg.credits.toLocaleString()} เครดิต</p>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="PromptPay QR"
                className="mx-auto w-56 h-56 rounded-lg border border-border"
              />
            ) : (
              <div className="mx-auto w-56 h-56 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            {polling && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                รอการยืนยันการชำระเงิน...
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            ระบบจะอัปเดตอัตโนมัติเมื่อได้รับการชำระเงิน (อาจใช้เวลา 1–2 นาที)
          </p>
          {!polling && (
            <Button variant="outline" className="w-full" onClick={() => { setStep("select"); setSelected(null); setQrUrl(null); }}>
              ยกเลิก
            </Button>
          )}
        </div>
      )}

      {/* Step: success */}
      {step === "success" && pkg && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">เติมเครดิตสำเร็จ!</p>
              <p className="text-muted-foreground text-sm mt-1">
                ได้รับ {pkg.credits.toLocaleString()} เครดิต
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push("/dashboard/credits")} variant="outline">
                ดูประวัติเครดิต
              </Button>
              <Button onClick={() => { setStep("select"); setSelected(null); }}>
                เติมอีกครั้ง
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: failed */}
      {step === "failed" && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">การชำระเงินล้มเหลว</p>
              <p className="text-muted-foreground text-sm mt-1">กรุณาลองใหม่อีกครั้ง</p>
            </div>
            <Button onClick={() => { setStep("select"); setSelected(null); setError(null); }}>
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
