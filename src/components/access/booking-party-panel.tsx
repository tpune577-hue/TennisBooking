"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Copy, CheckCheck, Loader2, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

type PartyData = {
  bookingId: string;
  bookingRef: string;
  guestCount: number;
  maxGuests: number;
  slotsFull: boolean;
  inviteToken: string | null;
  guests: { userId: string; name: string; acceptedAt: string }[];
};

type Props = {
  bookingId: string;
  courtName: string;
  date: string;
  startHour: number;
  coachName?: string | null;
  onClose?: () => void;
};

export function BookingPartyPanel({
  bookingId,
  courtName,
  date,
  startHour,
  coachName,
  onClose,
}: Props) {
  const [party, setParty] = useState<PartyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/party`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParty(data);
    } catch {
      setParty(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  const inviteLink =
    typeof window !== "undefined" && party?.inviteToken
      ? `${window.location.origin}/invite/${party.inviteToken}`
      : "";

  async function ensureInviteLink() {
    if (party?.inviteToken) return party.inviteToken;
    setCreating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "สร้างลิงก์ไม่สำเร็จ");
      await load();
      return data.token as string;
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    const token = await ensureInviteLink();
    if (!token) return;
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLineShare() {
    const token = await ensureInviteLink();
    if (!token) return;
    const link = `${window.location.origin}/invite/${token}`;
    const dateDisplay = date
      ? format(new Date(date + "T12:00:00"), "EEE d MMM", { locale: th })
      : "";
    const timeStr = `${String(startHour).padStart(2, "0")}:00 น.`;
    const text =
      `🎾 เชิญมาเล่นเทนนิสด้วยกัน!\n` +
      `${courtName} · ${dateDisplay} เวลา ${timeStr}\n` +
      (coachName ? `โค้ช: ${coachName}\n` : "") +
      `\nกดรับคำเชิญ: ${link}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, "_blank");
  }

  async function revokeGuest(userId: string, name: string) {
    if (!confirm(`ถอน ${name} ออกจากก๊วน?`)) return;
    setRevoking(userId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/guests/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ถอนไม่สำเร็จ");
    } finally {
      setRevoking(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!party) {
    return <p className="text-sm text-destructive text-center">โหลดข้อมูลก๊วนไม่สำเร็จ</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black mb-1">ชวนเพื่อนมาเล่น</h2>
        <p
          className={cn(
            "text-sm font-medium",
            party.slotsFull ? "text-amber-600" : "text-muted-foreground"
          )}
        >
          {party.slotsFull
            ? `แขกครบแล้ว (${party.guestCount}/${party.maxGuests})`
            : `รับเชิญแล้ว ${party.guestCount}/${party.maxGuests} · เหลือ ${party.maxGuests - party.guestCount} ที่`}
        </p>
      </div>

      {party.guests.length > 0 && (
        <ul className="space-y-2 rounded-xl border border-border p-3">
          {party.guests.map((g) => (
            <li key={g.userId} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium truncate">{g.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive shrink-0 h-8"
                disabled={revoking === g.userId}
                onClick={() => revokeGuest(g.userId, g.name)}
              >
                {revoking === g.userId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <UserMinus className="h-3.5 w-3.5 mr-1" />
                    ถอนออก
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {party.slotsFull ? (
        <p className="text-xs text-muted-foreground">
          ถอนแขกออกจากก๊วนเพื่อเปิดที่ว่างให้คนใหม่รับเชิญได้
        </p>
      ) : (
        <>
          {inviteLink && (
            <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2.5 border border-border">
              <span className="flex-1 text-xs text-muted-foreground font-mono truncate">
                {inviteLink}
              </span>
              <button type="button" onClick={handleCopy} className="shrink-0 text-muted-foreground">
                {copied ? (
                  <CheckCheck className="h-4 w-4 text-[color:var(--chart-2)]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleCopy}
            disabled={creating}
            variant="outline"
          >
            {creating ? "กำลังสร้างลิงก์..." : copied ? "คัดลอกแล้ว!" : "คัดลอกลิงก์เชิญ"}
          </Button>

          <button
            type="button"
            onClick={handleLineShare}
            disabled={creating}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[#06C755] text-white font-black text-base"
          >
            แชร์ผ่าน LINE
          </button>
        </>
      )}

      {onClose && (
        <Button variant="outline" className="w-full" onClick={onClose}>
          ปิด
        </Button>
      )}
    </div>
  );
}
