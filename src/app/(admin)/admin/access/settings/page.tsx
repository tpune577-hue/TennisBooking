"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Settings = {
  enabled: boolean;
  graceMinutesBefore: number;
  graceMinutesAfter: number;
  maxParticipantsPerBooking: number;
  requireResetReason: boolean;
};

export default function AdminAccessSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/access-settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/access-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data);
      setMsg("บันทึกแล้ว");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-semibold">ตั้งค่า QR เข้าสนาม</h1>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
        />
        เปิดใช้ระบบ QR
      </label>

      <div className="space-y-2">
        <Label>Grace ก่อนเริ่มจอง (นาที)</Label>
        <Input
          type="number"
          min={0}
          max={240}
          value={settings.graceMinutesBefore}
          onChange={(e) =>
            setSettings({
              ...settings,
              graceMinutesBefore: parseInt(e.target.value, 10) || 0,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Grace หลังจบจอง (นาที)</Label>
        <Input
          type="number"
          min={0}
          max={240}
          value={settings.graceMinutesAfter}
          onChange={(e) =>
            setSettings({
              ...settings,
              graceMinutesAfter: parseInt(e.target.value, 10) || 0,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>จำนวนคนสูงสุดต่อการจอง (รวม host)</Label>
        <Input
          type="number"
          min={2}
          max={20}
          value={settings.maxParticipantsPerBooking}
          onChange={(e) =>
            setSettings({
              ...settings,
              maxParticipantsPerBooking: parseInt(e.target.value, 10) || 6,
            })
          }
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.requireResetReason}
          onChange={(e) =>
            setSettings({ ...settings, requireResetReason: e.target.checked })
          }
        />
        บังคับเหตุผลเมื่อ Reset
      </label>

      <Button onClick={save} disabled={saving}>
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
