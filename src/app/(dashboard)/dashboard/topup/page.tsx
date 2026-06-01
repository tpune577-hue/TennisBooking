"use client";

import { useState, useCallback, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Omise global ────────────────────────────────────────────────────────────
declare global {
  interface Window {
    Omise: {
      setPublicKey(key: string): void;
      createToken(
        type: string,
        attrs: Record<string, string>,
        cb: (
          code: number,
          res: { id?: string; message?: string; code?: string }
        ) => void
      ): void;
    };
  }
}

// ─── Packages ────────────────────────────────────────────────────────────────
const PACKAGES = [
  { index: 0, thb: 500, credits: 500, label: "500 บาท", bonus: 0 },
  { index: 1, thb: 1000, credits: 1100, label: "1,000 บาท", bonus: 100 },
  { index: 2, thb: 2000, credits: 2400, label: "2,000 บาท", bonus: 400 },
  { index: 3, thb: 5000, credits: 6000, label: "5,000 บาท", bonus: 1000 },
] as const;

type Step = "select" | "method" | "qr" | "card" | "success" | "failed";

function fmtCardNumber(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function TopupPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [selected, setSelected] = useState<number>(1);
  const [step, setStep] = useState<Step>("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PromptPay
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(false);

  // Credit card
  const [omiseReady, setOmiseReady] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);

  // Success
  const [addedCredits, setAddedCredits] = useState(0);

  const pkg = PACKAGES[selected];

  async function startPromptPay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageIndex: selected, method: "promptpay" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }
      setPaymentId(data.paymentId);
      setQrUrl(data.qrImageUrl);
      setStep("qr");
      pollPayment(data.paymentId);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  const pollPayment = useCallback(
    async (id: string) => {
      pollingRef.current = true;
      setPolling(true);
      for (let i = 0; i < 60; i++) {
        if (!pollingRef.current) break;
        await new Promise((r) => setTimeout(r, 5000));
        if (!pollingRef.current) break;
        try {
          const res = await fetch(`/api/payments/${id}/status`);
          const data = await res.json();
          if (data.status === "paid") {
            setAddedCredits(pkg.credits);
            await updateSession();
            setStep("success");
            setPolling(false);
            pollingRef.current = false;
            return;
          }
          if (data.status === "failed") {
            setStep("failed");
            setPolling(false);
            pollingRef.current = false;
            return;
          }
        } catch {
          // ignore transient errors
        }
      }
      setPolling(false);
      setError("หมดเวลา กรุณาตรวจสอบยอดเครดิตในหน้า เครดิตของฉัน");
    },
    [pkg.credits, updateSession]
  );

  async function submitCard() {
    if (!window.Omise) {
      setCardError("โหลด Omise.js ไม่สำเร็จ กรุณา reload");
      return;
    }
    const rawNumber = cardNumber.replace(/\s/g, "");
    const expiryParts = cardExpiry.split("/");
    if (rawNumber.length < 13 || expiryParts.length !== 2 || cardCvv.length < 3) {
      setCardError("กรุณากรอกข้อมูลบัตรให้ครบถ้วน");
      return;
    }
    setLoading(true);
    setCardError(null);
    window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY ?? "");
    window.Omise.createToken(
      "card",
      {
        name: cardName || "Cardholder",
        number: rawNumber,
        expiration_month: expiryParts[0],
        expiration_year: `20${expiryParts[1]}`,
        security_code: cardCvv,
      },
      async (code, response) => {
        if (code !== 200 || !response.id) {
          setCardError(response.message ?? "ข้อมูลบัตรไม่ถูกต้อง");
          setLoading(false);
          return;
        }
        try {
          const res = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              packageIndex: selected,
              method: "credit_card",
              cardToken: response.id,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setCardError(data.error ?? "การชำระเงินล้มเหลว");
            setLoading(false);
            return;
          }
          if (data.status === "successful" || data.status === "paid") {
            setAddedCredits(pkg.credits);
            await updateSession();
            setStep("success");
          } else {
            setStep("failed");
          }
        } catch {
          setCardError("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
          setLoading(false);
        }
      }
    );
  }

  function reset() {
    pollingRef.current = false;
    setStep("select");
    setError(null);
    setQrUrl(null);
    setPaymentId(null);
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardName("");
    setCardError(null);
  }

  return (
    <>
      <Script
        src="https://cdn.omise.co/omise.js"
        strategy="lazyOnload"
        onLoad={() => setOmiseReady(true)}
      />

      <div className="space-y-6 max-w-lg">
        <h1 className="text-2xl font-semibold text-foreground">เติมเครดิต</h1>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── select package ── */}
        {step === "select" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">เลือก Package ที่ต้องการ</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PACKAGES.map((p) => {
                const isActive = selected === p.index;
                return (
                  <button
                    key={p.index}
                    onClick={() => setSelected(p.index)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground text-sm">{p.label}</span>
                      {isActive && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="text-2xl font-bold text-foreground tabular-nums">
                      {p.credits.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">เครดิต</div>
                    {p.bonus > 0 && (
                      <span className="inline-block bg-[color:var(--chart-2)]/10 text-[color:var(--chart-2)] text-xs font-bold px-2 py-0.5 rounded-full">
                        +{p.bonus} โบนัส
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <Button className="w-full" onClick={() => setStep("method")}>
              ดำเนินการต่อ
            </Button>
          </div>
        )}

        {/* ── method ── */}
        {step === "method" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Package ที่เลือก</p>
              <p className="font-semibold text-foreground">
                {pkg.label} →{" "}
                <span className="text-primary">{pkg.credits.toLocaleString()} เครดิต</span>
                {pkg.bonus > 0 && (
                  <span className="text-xs text-[color:var(--chart-2)] ml-1">(+{pkg.bonus} โบนัส)</span>
                )}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">เลือกวิธีชำระเงิน</p>
            <div className="grid gap-3">
              <button
                onClick={() => { setError(null); startPromptPay(); }}
                disabled={loading}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-all text-left"
              >
                <QrCode className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">PromptPay QR</p>
                  <p className="text-xs text-muted-foreground">สแกน QR Code จ่ายผ่านแอปธนาคาร</p>
                </div>
                {loading && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
              </button>
              <button
                onClick={() => { setError(null); setStep("card"); }}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-all text-left"
              >
                <CreditCard className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Credit / Debit Card</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, JCB</p>
                </div>
              </button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setStep("select")}>
              ← เลือก Package อื่น
            </Button>
          </div>
        )}

        {/* ── PromptPay QR ── */}
        {step === "qr" && (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <p className="font-semibold text-foreground">สแกน QR Code เพื่อชำระเงิน</p>
              <p className="text-sm text-muted-foreground">
                {pkg.label} → {pkg.credits.toLocaleString()} เครดิต
              </p>
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="PromptPay QR" className="mx-auto w-56 h-56 rounded-lg border border-border" />
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
              ระบบจะอัปเดตอัตโนมัติเมื่อได้รับการชำระเงิน (1–2 นาที)
            </p>
            {!polling && (
              <Button variant="outline" className="w-full" onClick={reset}>ยกเลิก</Button>
            )}
          </div>
        )}

        {/* ── Credit Card ── */}
        {step === "card" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">ยอดชำระ</p>
              <p className="font-bold text-foreground">{pkg.label}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <p className="font-medium text-foreground">ข้อมูลบัตร</p>
              {cardError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {cardError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">หมายเลขบัตร</label>
                  <Input
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(fmtCardNumber(e.target.value))}
                    className="font-mono tracking-wider"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">วันหมดอายุ</label>
                    <Input
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(fmtExpiry(e.target.value))}
                      className="font-mono"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">CVV</label>
                    <Input
                      inputMode="numeric"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="font-mono"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">ชื่อบนบัตร (ถ้ามี)</label>
                  <Input
                    placeholder="FIRSTNAME LASTNAME"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              🔒 ข้อมูลบัตรเข้ารหัสโดย Omise ไม่ผ่านเซิร์ฟเวอร์ของเรา
            </p>
            <Button
              className="w-full"
              onClick={submitCard}
              disabled={loading || !omiseReady}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />กำลังชำระเงิน...</>
              ) : !omiseReady ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />โหลดระบบ...</>
              ) : (
                `🔒 ชำระ ${pkg.label}`
              )}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setStep("method")}>
              ← เลือกวิธีอื่น
            </Button>
          </div>
        )}

        {/* ── success ── */}
        {step === "success" && (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--chart-2)]/15">
                <CheckCircle2 className="h-8 w-8 text-[color:var(--chart-2)]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">เติมเครดิตสำเร็จ!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  ได้รับ <span className="font-bold text-[color:var(--chart-2)]">+{addedCredits.toLocaleString()}</span> เครดิต
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.push("/dashboard/credits")}>
                  ดูประวัติเครดิต
                </Button>
                <Button onClick={reset}>เติมอีกครั้ง</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── failed ── */}
        {step === "failed" && (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">การชำระเงินล้มเหลว</p>
                <p className="text-muted-foreground text-sm mt-1">กรุณาลองใหม่อีกครั้ง</p>
              </div>
              <Button onClick={reset}>ลองใหม่</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
