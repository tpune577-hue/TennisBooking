"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLiff } from "@/lib/liff/provider";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  Coins,
  CreditCard,
  Loader2,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Omise global type ───────────────────────────────────────────────────────
declare global {
  interface Window {
    Omise: {
      setPublicKey(key: string): void;
      createToken(
        type: string,
        attrs: Record<string, string>,
        cb: (
          statusCode: number,
          response: { id?: string; message?: string; code?: string }
        ) => void
      ): void;
    };
  }
}

// ─── Packages ────────────────────────────────────────────────────────────────
const PACKAGES = [
  { index: 0, thb: 500, credits: 500, label: "500", bonus: 0 },
  { index: 1, thb: 1000, credits: 1100, label: "1,000", bonus: 100 },
  { index: 2, thb: 2000, credits: 2400, label: "2,000", bonus: 400 },
  { index: 3, thb: 5000, credits: 6000, label: "5,000", bonus: 1000 },
] as const;

type Screen = "packages" | "method" | "promptpay" | "card" | "success" | "failed";

// ─── Card input helpers ───────────────────────────────────────────────────────
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

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LiffTopupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isReady: liffReady } = useLiff();

  const [screen, setScreen] = useState<Screen>("packages");
  const [selected, setSelected] = useState<number>(1); // default 1,000 THB
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PromptPay state
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(false);

  // Credit card state
  const [omiseReady, setOmiseReady] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);

  // Success state
  const [addedCredits, setAddedCredits] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/liff/topup");
    }
  }, [status, router]);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current = false;
    };
  }, []);

  const pkg = PACKAGES[selected];
  const creditBalance =
    (session?.user as unknown as { creditBalance?: number })?.creditBalance ?? 0;

  // ─── PromptPay flow ─────────────────────────────────────────────────────────
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
        setError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
        return;
      }
      setPaymentId(data.paymentId);
      setQrUrl(data.qrImageUrl);
      setScreen("promptpay");
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
      const maxAttempts = 60; // 5 min at 5s intervals
      for (let i = 0; i < maxAttempts; i++) {
        if (!pollingRef.current) break;
        await new Promise((r) => setTimeout(r, 5000));
        if (!pollingRef.current) break;
        try {
          const res = await fetch(`/api/payments/${id}/status`);
          const data = await res.json();
          if (data.status === "paid") {
            setAddedCredits(pkg.credits);
            setScreen("success");
            setPolling(false);
            pollingRef.current = false;
            return;
          }
          if (data.status === "failed") {
            setScreen("failed");
            setPolling(false);
            pollingRef.current = false;
            return;
          }
        } catch {
          // ignore transient network errors
        }
      }
      setPolling(false);
      setError("หมดเวลารอ กรุณาตรวจสอบยอดเครดิตในหน้า เครดิตของฉัน");
    },
    [pkg.credits]
  );

  // ─── Credit card flow ───────────────────────────────────────────────────────
  async function submitCard() {
    if (!window.Omise) {
      setCardError("โหลด Omise.js ไม่สำเร็จ กรุณา reload");
      return;
    }

    const rawNumber = cardNumber.replace(/\s/g, "");
    const expiryParts = cardExpiry.split("/");
    if (
      rawNumber.length < 13 ||
      expiryParts.length !== 2 ||
      cardCvv.length < 3
    ) {
      setCardError("กรุณากรอกข้อมูลบัตรให้ครบถ้วน");
      return;
    }

    setLoading(true);
    setCardError(null);
    window.Omise.setPublicKey(
      process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY ?? ""
    );

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
            setScreen("success");
          } else {
            setScreen("failed");
          }
        } catch {
          setCardError("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
          setLoading(false);
        }
      }
    );
  }

  // ─── Render guards ───────────────────────────────────────────────────────────
  if (status === "loading" || !liffReady) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  // ─── Screens ──────────────────────────────────────────────────────────────────

  if (screen === "success") {
    return (
      <div className="flex flex-col flex-1 bg-background">
        <div className="bg-card px-4 py-4 border-b border-border">
          <h1 className="text-lg font-bold">เติมเครดิต</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-[color:var(--chart-2)]/15 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-[color:var(--chart-2)]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-foreground">
              เติมเครดิตสำเร็จ!
            </h2>
            <p className="text-muted-foreground text-sm">
              ได้รับ{" "}
              <span className="font-black text-[color:var(--chart-2)] text-lg">
                +{addedCredits.toLocaleString()}
              </span>{" "}
              เครดิต
            </p>
          </div>
          <div className="w-full max-w-xs space-y-3 mt-2">
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={() => router.push("/liff/book")}
            >
              กลับไปจองสนาม
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => router.push("/dashboard/credits")}
            >
              ดูประวัติเครดิต
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setScreen("packages");
                setQrUrl(null);
                setPaymentId(null);
                setCardNumber("");
                setCardExpiry("");
                setCardCvv("");
                setCardName("");
              }}
            >
              เติมเครดิตอีกครั้ง
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "failed") {
    return (
      <div className="flex flex-col flex-1 bg-background">
        <div className="bg-card px-4 py-4 border-b border-border">
          <h1 className="text-lg font-bold">เติมเครดิต</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">
              การชำระเงินล้มเหลว
            </h2>
            <p className="text-muted-foreground text-sm">
              กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง
            </p>
          </div>
          <Button
            className="w-full max-w-xs h-12 text-base font-semibold"
            onClick={() => {
              setScreen("packages");
              setError(null);
              setQrUrl(null);
            }}
          >
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  // ─── Normal screens ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Load Omise.js for credit card tokenization */}
      <Script
        src="https://cdn.omise.co/omise.js"
        strategy="lazyOnload"
        onLoad={() => setOmiseReady(true)}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          {screen !== "packages" ? (
            <button
              onClick={() => {
                pollingRef.current = false;
                if (screen === "method") setScreen("packages");
                else if (screen === "promptpay" || screen === "card")
                  setScreen("method");
                else setScreen("packages");
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-base font-bold">เติมเครดิต</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold tabular-nums">{creditBalance}</span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Screen: Package Selection ── */}
      {screen === "packages" && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              เลือก Package ที่ต้องการ
            </p>

            <div className="grid grid-cols-2 gap-3">
              {PACKAGES.map((p) => {
                const isActive = selected === p.index;
                return (
                  <button
                    key={p.index}
                    onClick={() => setSelected(p.index)}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-left transition-all",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        ฿{p.label}
                      </span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "text-2xl font-black tabular-nums",
                        isActive ? "text-primary" : "text-foreground"
                      )}
                    >
                      {p.credits.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      เครดิต
                    </div>
                    {p.bonus > 0 ? (
                      <span className="inline-block bg-[color:var(--chart-2)]/10 text-[color:var(--chart-2)] text-xs font-bold px-2 py-0.5 rounded-full">
                        +{p.bonus} โบนัส
                      </span>
                    ) : (
                      <span className="text-xs text-transparent select-none">
                        &nbsp;
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Value proposition */}
            <div className="bg-muted/40 rounded-2xl p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-sm">
                ทำไมต้องซื้อเครดิต?
              </p>
              <p>✅ ใช้จองสนามได้ทันที ไม่ต้องรอ</p>
              <p>✅ เครดิตไม่หมดอายุ 1 ปี</p>
              <p>✅ ยิ่งซื้อเยอะ ยิ่งได้โบนัสเพิ่ม</p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-4">
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={() => setScreen("method")}
            >
              ดำเนินการต่อ — ฿{pkg.label}
            </Button>
          </div>
        </>
      )}

      {/* ── Screen: Method Selection ── */}
      {screen === "method" && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Package summary */}
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Package ที่เลือก
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base">
                    {pkg.credits.toLocaleString()} เครดิต
                  </p>
                  {pkg.bonus > 0 && (
                    <p className="text-xs text-[color:var(--chart-2)] font-semibold">
                      รวมโบนัส +{pkg.bonus} เครดิต
                    </p>
                  )}
                </div>
                <p className="text-xl font-black text-foreground">
                  ฿{pkg.label}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              เลือกวิธีชำระเงิน
            </p>

            {/* PromptPay */}
            <button
              onClick={() => {
                setError(null);
                startPromptPay();
              }}
              disabled={loading}
              className="w-full flex items-center gap-4 bg-card border-2 border-border rounded-2xl p-5 text-left hover:border-primary/40 transition-all active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">PromptPay QR</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  สแกน QR Code ผ่านแอปธนาคารหรือ LINE
                </p>
              </div>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-muted-foreground text-lg">›</span>
              )}
            </button>

            {/* Credit Card */}
            <button
              onClick={() => {
                setError(null);
                setScreen("card");
              }}
              className="w-full flex items-center gap-4 bg-card border-2 border-border rounded-2xl p-5 text-left hover:border-primary/40 transition-all active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">
                  Credit / Debit Card
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visa, Mastercard, JCB
                </p>
              </div>
              <span className="text-muted-foreground text-lg">›</span>
            </button>
          </div>
        </>
      )}

      {/* ── Screen: PromptPay QR ── */}
      {screen === "promptpay" && pkg && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-4">
            <p className="font-bold text-foreground">
              สแกน QR Code เพื่อชำระเงิน
            </p>
            <p className="text-sm text-muted-foreground">
              ฿{pkg.label} → {pkg.credits.toLocaleString()} เครดิต
            </p>

            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="PromptPay QR"
                className="w-56 h-56 rounded-xl border border-border"
              />
            ) : (
              <div className="w-56 h-56 rounded-xl border border-border bg-muted flex items-center justify-center">
                <QrCode className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}

            {polling && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                รอยืนยันการชำระเงิน...
              </div>
            )}
          </div>

          <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground text-center space-y-0.5">
            <p>เปิดแอปธนาคารหรือ LINE Pay แล้วสแกน QR ด้านบน</p>
            <p>ระบบจะอัปเดตอัตโนมัติเมื่อได้รับการชำระเงิน (1–2 นาที)</p>
          </div>

          {!polling && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                pollingRef.current = false;
                setScreen("packages");
                setQrUrl(null);
                setPaymentId(null);
              }}
            >
              ยกเลิก
            </Button>
          )}
        </div>
      )}

      {/* ── Screen: Credit Card ── */}
      {screen === "card" && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Package summary */}
            <div className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">ยอดชำระ</p>
              <p className="font-black text-lg">฿{pkg.label}</p>
            </div>

            {/* Card form */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <p className="font-bold text-sm">ข้อมูลบัตร</p>

              {cardError && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {cardError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    หมายเลขบัตร
                  </label>
                  <Input
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(fmtCardNumber(e.target.value))
                    }
                    className="font-mono tracking-wider h-11"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      วันหมดอายุ
                    </label>
                    <Input
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) =>
                        setCardExpiry(fmtExpiry(e.target.value))
                      }
                      className="font-mono h-11"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      CVV / CVC
                    </label>
                    <Input
                      inputMode="numeric"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      className="font-mono h-11"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    ชื่อบนบัตร (ถ้ามี)
                  </label>
                  <Input
                    placeholder="FIRSTNAME LASTNAME"
                    value={cardName}
                    onChange={(e) =>
                      setCardName(e.target.value.toUpperCase())
                    }
                    className="font-mono uppercase h-11"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              🔒 ข้อมูลบัตรถูกเข้ารหัสและประมวลผลโดย Omise อย่างปลอดภัย
            </p>
          </div>

          <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-4">
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={submitCard}
              disabled={loading || !omiseReady}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังชำระเงิน...
                </>
              ) : !omiseReady ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  โหลดระบบชำระเงิน...
                </>
              ) : (
                `🔒 ชำระ ฿${pkg.label}`
              )}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
