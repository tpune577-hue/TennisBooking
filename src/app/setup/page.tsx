"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function SetupPage() {
  const [result, setResult] = useState<{ ok: boolean; message: string; user?: { name: string; role: string } } | null>(null);
  const [loading, setLoading] = useState(false);

  async function promote() {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/promote-admin?secret=tennis-setup-2026", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: data.message, user: data.user });
      } else {
        setResult({ ok: false, message: data.error ?? "เกิดข้อผิดพลาด" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Admin Setup</h1>
          <p className="text-sm text-muted-foreground">
            กด Promote เพื่อตั้งให้ account ที่ login อยู่ตอนนี้เป็น Super Admin
          </p>
        </div>

        {!result && (
          <Button className="w-full" onClick={promote} disabled={loading}>
            {loading ? "กำลังดำเนินการ..." : "Promote ตัวเองเป็น Super Admin"}
          </Button>
        )}

        {result && (
          <div className={`rounded-lg border p-4 space-y-3 ${result.ok ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
            <div className="flex items-center gap-2">
              {result.ok
                ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                : <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
              <p className={`text-sm font-medium ${result.ok ? "text-green-500" : "text-red-500"}`}>
                {result.ok ? "สำเร็จ!" : "ไม่สำเร็จ"}
              </p>
            </div>
            <p className="text-sm text-foreground">{result.message}</p>
            {result.user && (
              <p className="text-xs text-muted-foreground">
                {result.user.name} → role: <span className="font-mono text-primary">{result.user.role}</span>
              </p>
            )}
            {result.ok && (
              <a href="/api/auth/signout">
                <Button className="w-full mt-2" variant="outline">
                  Sign Out เพื่อ refresh session →
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
