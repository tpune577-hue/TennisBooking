"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ScanLine, AlertTriangle } from "lucide-react";

type ScanResponse = {
  ok: boolean;
  result: string;
  message: string;
  alert?: boolean;
  pass?: {
    id: string;
    role: string;
    presence: string;
    userName: string;
    bookingRef: string;
    courtName: string;
  };
};

export default function AdminAccessScanPage() {
  const [token, setToken] = useState("");
  const [last, setLast] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetReason, setResetReason] = useState("");
  const [resetPassId, setResetPassId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function scan(opts?: { direction?: "in" | "out"; force?: boolean }) {
    setLoading(true);
    try {
      const res = await fetch("/api/access/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          direction: opts?.direction,
          force: opts?.force ?? false,
        }),
      });
      const data = (await res.json()) as ScanResponse;
      setLast(data);
      if (data.pass?.id) setResetPassId(data.pass.id);
      if (data.ok) setToken("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resetPass() {
    if (!resetPassId || !resetReason.trim()) {
      alert("ระบุเหตุผลการ Reset");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/access/passes/${resetPassId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: resetReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetReason("");
      setLast({
        ok: true,
        result: "reset",
        message: "Reset สำเร็จ — สถานะอยู่นอกสนาม",
        pass: last?.pass,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reset ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ScanLine className="h-6 w-6" />
          สแกน QR เข้าสนาม
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          วางโฟกัสที่ช่องด้านล่างแล้วสแกนด้วยเครื่องอ่าน QR
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="token">รหัส QR</Label>
        <Input
          id="token"
          ref={inputRef}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && token.trim()) scan();
          }}
          placeholder="gtc-access:..."
          autoComplete="off"
          className="font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => scan()} disabled={loading || !token.trim()}>
          สแกน (สลับเข้า/ออก)
        </Button>
        <Button
          variant="outline"
          onClick={() => scan({ direction: "in", force: true })}
          disabled={loading || !token.trim()}
        >
          บังคับเข้า
        </Button>
        <Button
          variant="outline"
          onClick={() => scan({ direction: "out", force: true })}
          disabled={loading || !token.trim()}
        >
          บังคับออก
        </Button>
      </div>

      {last && (
        <div
          className={cn(
            "rounded-xl border p-5 space-y-2",
            last.ok
              ? "border-green-500/40 bg-green-500/10"
              : last.alert
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-red-500/40 bg-red-500/10"
          )}
        >
          {last.alert && (
            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              ต้องการความช่วยเหลือ
            </div>
          )}
          <p className="font-bold text-lg">{last.message}</p>
          {last.pass && (
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>{last.pass.userName}</p>
              <p className="font-mono">{last.pass.bookingRef}</p>
              <p>{last.pass.courtName}</p>
              <p className="capitalize">
                {last.pass.role} · {last.pass.presence}
              </p>
            </div>
          )}
        </div>
      )}

      {resetPassId && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="text-sm font-medium">Reset สถานะ (อยู่นอกสนาม)</p>
          <Textarea
            value={resetReason}
            onChange={(e) => setResetReason(e.target.value)}
            placeholder="เหตุผล เช่น ลืมสแกนออก"
            rows={2}
          />
          <Button variant="destructive" onClick={resetPass} disabled={loading}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
