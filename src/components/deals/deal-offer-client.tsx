"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  QrCode,
} from "lucide-react";
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

interface DealData {
  id: string;
  priceThb: number;
  creditAmount: number;
  bonusPercent: number;
  expiresAt: string;
  status: "non_paid" | "paid" | "expired" | "cancelled";
  canPay: boolean;
}

type Step = "detail" | "method" | "qr" | "card" | "success" | "failed";

const STATUS_LABELS: Record<DealData["status"], string> = {
  non_paid: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  expired: "หมดอายุ",
  cancelled: "ยกเลิกแล้ว",
};

function fmtCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function DealOfferClient({
  offerId,
  autoPay = false,
  onBack,
}: {
  offerId: string;
  autoPay?: boolean;
  onBack?: () => void;
}) {
  const { update: updateSession } = useSession();
  const [deal, setDeal] = useState<DealData | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("detail");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(false);
  const [omiseReady, setOmiseReady] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);
  const autoPayHandled = useRef(false);

  const loadDeal = useCallback(async () => {
    setLoadingDeal(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/deals/${offerId}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "ไม่พบ Deal");
        setDeal(null);
        return;
      }
      setDeal(data);
    } catch {
      setLoadError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoadingDeal(false);
    }
  }, [offerId]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  useEffect(() => {
    if (autoPay && deal?.canPay && !autoPayHandled.current) {
      autoPayHandled.current = true;
      setStep("method");
    }
  }, [autoPay, deal]);

  useEffect(() => {
    return () => {
      pollingRef.current = false;
    };
  }, []);

  const pollPayment = useCallback(
    async (id: string, credits: number) => {
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
            await updateSession();
            setDeal((d) => (d ? { ...d, status: "paid", canPay: false } : d));
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
          // ignore
        }
      }
      setPolling(false);
      setError(`หมดเวลา — หากชำระแล้ว เครดิต ${credits.toLocaleString()} จะปรากฏในบัญชีของคุณ`);
    },
    [updateSession]
  );

  async function startPromptPay() {
    if (!deal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealOfferId: offerId, method: "promptpay" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "เกิดข้อผิดพลาด");
        return;
      }
      setPaymentId(data.paymentId);
      setQrUrl(data.qrImageUrl);
      setStep("qr");
      pollPayment(data.paymentId, deal.creditAmount);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  async function submitCard() {
    if (!deal || !window.Omise) {
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
              dealOfferId: offerId,
              method: "credit_card",
              cardToken: response.id,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setCardError(typeof data.error === "string" ? data.error : "การชำระเงินล้มเหลว");
            setLoading(false);
            return;
          }
          if (data.status === "successful" || data.status === "paid") {
            await updateSession();
            setDeal((d) => (d ? { ...d, status: "paid", canPay: false } : d));
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

  if (loadingDeal) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        กำลังโหลด...
      </div>
    );
  }

  if (loadError || !deal) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {loadError ?? "ไม่พบ Deal"}
      </div>
    );
  }

  const expireLabel = new Date(deal.expiresAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Script
        src="https://cdn.omise.co/omise.js"
        strategy="lazyOnload"
        onLoad={() => setOmiseReady(true)}
      />

      <div className="space-y-4 max-w-lg">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {step === "detail" && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">ข้อเสนอเติมเครดิตพิเศษ</p>
                <p className="text-lg font-semibold mt-1">{STATUS_LABELS[deal.status]}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">ราคา</p>
                  <p className="text-xl font-bold tabular-nums">{deal.priceThb.toLocaleString()} บาท</p>
                </div>
                <div>
                  <p className="text-muted-foreground">เครดิตที่ได้รับ</p>
                  <p className="text-xl font-bold tabular-nums">{deal.creditAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">โบนัส</p>
                  <p className="font-medium text-[color:var(--chart-2)]">
                    {deal.bonusPercent > 0 ? `+${deal.bonusPercent}%` : "0%"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">หมดอายุ</p>
                  <p className="font-medium">{expireLabel}</p>
                </div>
              </div>
              {deal.canPay ? (
                <Button className="w-full" onClick={() => setStep("method")}>
                  ชำระเงิน {deal.priceThb.toLocaleString()} บาท
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {deal.status === "paid"
                    ? "ชำระเงินเรียบร้อยแล้ว — เครดิตถูกเพิ่มในบัญชีของคุณ"
                    : deal.status === "cancelled"
                      ? "ข้อเสนอนี้ถูกยกเลิกโดยทีมงาน"
                      : "ข้อเสนอนี้หมดอายุแล้ว"}
                </p>
              )}
              {onBack && (
                <Button variant="ghost" className="w-full" onClick={onBack}>
                  กลับ
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {step === "method" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ชำระ {deal.priceThb.toLocaleString()} บาท → ได้ {deal.creditAmount.toLocaleString()} เครดิต
            </p>
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex items-center gap-3 justify-start"
              onClick={startPromptPay}
              disabled={loading}
            >
              <QrCode className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <div className="font-medium">PromptPay QR</div>
                <div className="text-xs text-muted-foreground">สแกนจ่ายผ่านแอปธนาคาร</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex items-center gap-3 justify-start"
              onClick={() => setStep("card")}
              disabled={loading || !omiseReady}
            >
              <CreditCard className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <div className="font-medium">บัตรเครดิต / เดบิต</div>
                <div className="text-xs text-muted-foreground">Visa, Mastercard, JCB</div>
              </div>
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("detail")}>
              กลับ
            </Button>
          </div>
        )}

        {step === "qr" && (
          <div className="space-y-4 text-center">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="PromptPay QR" className="mx-auto w-56 h-56 rounded-lg border" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            )}
            <p className="text-sm text-muted-foreground">
              {polling ? "รอการชำระเงิน..." : "สแกน QR เพื่อชำระเงิน"}
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                pollingRef.current = false;
                setStep("method");
              }}
            >
              ยกเลิก
            </Button>
          </div>
        )}

        {step === "card" && (
          <div className="space-y-3">
            {cardError && (
              <p className="text-sm text-destructive">{cardError}</p>
            )}
            <Input placeholder="หมายเลขบัตร" value={cardNumber} onChange={(e) => setCardNumber(fmtCardNumber(e.target.value))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(fmtExpiry(e.target.value))} />
              <Input placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </div>
            <Input placeholder="ชื่อบนบัตร" value={cardName} onChange={(e) => setCardName(e.target.value)} />
            <Button className="w-full" onClick={submitCard} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `ชำระ ${deal.priceThb.toLocaleString()} บาท`}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("method")}>
              กลับ
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-4 py-6">
            <CheckCircle2 className="h-12 w-12 text-[color:var(--chart-2)] mx-auto" />
            <p className="font-semibold text-lg">ชำระเงินสำเร็จ!</p>
            <p className="text-muted-foreground text-sm">
              ได้รับ {deal.creditAmount.toLocaleString()} เครดิต
            </p>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                กลับ
              </Button>
            )}
          </div>
        )}

        {step === "failed" && (
          <div className="text-center space-y-4 py-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="font-semibold">การชำระเงินไม่สำเร็จ</p>
            <Button onClick={() => setStep("method")}>ลองใหม่</Button>
          </div>
        )}
      </div>
    </>
  );
}
