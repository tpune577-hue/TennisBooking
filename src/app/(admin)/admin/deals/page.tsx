"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Tag, Loader2 } from "lucide-react";
import { dealBonusPercent } from "@/lib/deals/bonus-percent";

export const dynamic = "force-dynamic";

interface Member {
  id: string;
  name: string;
  email: string | null;
  lineUserId: string | null;
}

interface DealOffer {
  id: string;
  userId: string;
  priceThb: number;
  creditAmount: number;
  expiresAt: string;
  status: "non_paid" | "paid" | "expired" | "cancelled";
  sentViaLine: boolean;
  sentViaEmail: boolean;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null; lineUserId: string | null };
}

type StatusFilter = "all" | DealOffer["status"];

const STATUS_LABELS: Record<DealOffer["status"], string> = {
  non_paid: "Non Paid",
  paid: "Paid",
  expired: "Expire",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<DealOffer["status"], "default" | "secondary" | "destructive" | "outline"> = {
  non_paid: "outline",
  paid: "default",
  expired: "secondary",
  cancelled: "destructive",
};

type DialogStep = "form" | "confirm";

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>("form");
  const [sending, setSending] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [memberQ, setMemberQ] = useState("");
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [priceThb, setPriceThb] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sendLine, setSendLine] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/deals${q}`);
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const priceNum = parseInt(priceThb, 10);
  const creditNum = parseInt(creditAmount, 10);
  const bonusPct = useMemo(() => {
    if (isNaN(priceNum) || isNaN(creditNum) || priceNum <= 0) return null;
    return dealBonusPercent(priceNum, creditNum);
  }, [priceNum, creditNum]);

  async function searchMembers(q: string) {
    setMemberLoading(true);
    try {
      const res = await fetch(`/api/admin/members?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setMemberResults(Array.isArray(data) ? data : []);
    } finally {
      setMemberLoading(false);
    }
  }

  function resetDialog() {
    setDialogStep("form");
    setSelectedMember(null);
    setMemberQ("");
    setMemberResults([]);
    setPriceThb("");
    setCreditAmount("");
    setExpiresAt("");
    setSendLine(true);
    setSendEmail(false);
  }

  function openNewDeal() {
    resetDialog();
    setDialogOpen(true);
  }

  function validateForm(): string | null {
    if (!selectedMember) return "เลือกสมาชิก";
    if (isNaN(priceNum) || priceNum < 1) return "กรอกราคา (บาท)";
    if (isNaN(creditNum) || creditNum < priceNum) return "เครดิตต้องมากกว่าหรือเท่ากับราคา";
    if (!expiresAt) return "กำหนดวันหมดอายุ";
    if (new Date(expiresAt) <= new Date()) return "วันหมดอายุต้องอยู่ในอนาคต";
    if (!sendLine && !sendEmail) return "เลือกช่องทางส่งอย่างน้อย 1 ช่องทาง";
    if (sendLine && !selectedMember.lineUserId) return "สมาชิกไม่มี LINE";
    if (sendEmail && !selectedMember.email) return "สมาชิกไม่มีอีเมล";
    return null;
  }

  async function submitDeal() {
    const err = validateForm();
    if (err || !selectedMember) {
      setToast(err ?? "ข้อมูลไม่ครบ");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMember.id,
          priceThb: priceNum,
          creditAmount: creditNum,
          expiresAt: new Date(expiresAt).toISOString(),
          sendLine,
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "ส่งไม่สำเร็จ";
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
        return;
      }

      const parts = ["ส่ง Deal สำเร็จ"];
      if (sendLine) {
        parts.push(data.lineNotification?.sent ? "LINE ✓" : `LINE ✗ (${data.lineNotification?.reason})`);
      }
      if (sendEmail) {
        parts.push(data.emailNotification?.sent ? "Email ✓" : `Email ✗ (${data.emailNotification?.reason})`);
      }
      setToast(parts.join(" · "));
      setDialogOpen(false);
      resetDialog();
      loadDeals();
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSending(false);
    }
  }

  async function cancelDeal(id: string) {
    if (!confirm("ยกเลิก Deal นี้?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/admin/deals/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setToast("ยกเลิก Deal แล้ว");
        loadDeals();
      } else {
        setToast(data.error ?? "ยกเลิกไม่สำเร็จ");
      }
      setTimeout(() => setToast(null), 3000);
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Deal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">ส่งข้อเสนอเติมเครดิตให้สมาชิก</p>
        </div>
        <Button onClick={openNewDeal}>ส่ง Deal ใหม่</Button>
      </div>

      {toast && (
        <div className="rounded-lg border bg-muted/50 px-4 py-2.5 text-sm">{toast}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "non_paid", "paid", "expired", "cancelled"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "ทั้งหมด" : STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการ Deal ที่ส่ง</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สมาชิก</TableHead>
                <TableHead>ราคา</TableHead>
                <TableHead>เครดิต</TableHead>
                <TableHead>โบนัส</TableHead>
                <TableHead>หมดอายุ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ช่องทาง</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : deals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    ยังไม่มี Deal
                  </TableCell>
                </TableRow>
              ) : (
                deals.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.user.name}</TableCell>
                    <TableCell>{d.priceThb.toLocaleString()} ฿</TableCell>
                    <TableCell>{d.creditAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      {dealBonusPercent(d.priceThb, d.creditAmount) > 0
                        ? `+${dealBonusPercent(d.priceThb, d.creditAmount)}%`
                        : "0%"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(d.expiresAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[d.status]}>{STATUS_LABELS[d.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.sentViaLine && "LINE "}
                      {d.sentViaEmail && "Email"}
                    </TableCell>
                    <TableCell>
                      {d.status === "non_paid" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={cancellingId === d.id}
                          onClick={() => cancelDeal(d.id)}
                        >
                          {cancellingId === d.id ? "..." : "Cancel"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetDialog(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogStep === "form" ? "ส่ง Deal ใหม่" : "ยืนยันก่อนส่ง"}
            </DialogTitle>
          </DialogHeader>

          {dialogStep === "form" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>สมาชิก</Label>
                {selectedMember ? (
                  <div className="rounded-lg border p-3 text-sm space-y-1">
                    <p className="font-medium">{selectedMember.name}</p>
                    <p className="text-muted-foreground text-xs">
                      LINE: {selectedMember.lineUserId ? "✓" : "✗"} · Email: {selectedMember.email ? "✓" : "✗"}
                    </p>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedMember(null)}>
                      เปลี่ยน
                    </Button>
                  </div>
                ) : (
                  <>
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        searchMembers(memberQ);
                      }}
                    >
                      <Input
                        placeholder="ค้นหาชื่อ / อีเมล / เบอร์"
                        value={memberQ}
                        onChange={(e) => setMemberQ(e.target.value)}
                      />
                      <Button type="submit" size="icon" variant="outline">
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>
                    {memberLoading && <p className="text-xs text-muted-foreground">กำลังค้นหา...</p>}
                    <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                      {memberResults.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                          onClick={() => {
                            setSelectedMember(m);
                            setSendLine(!!m.lineUserId);
                            setSendEmail(false);
                          }}
                        >
                          <span className="font-medium">{m.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            LINE {m.lineUserId ? "✓" : "✗"} · Email {m.email ? "✓" : "✗"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price (บาท)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={priceThb}
                    onChange={(e) => setPriceThb(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credits</Label>
                  <Input
                    type="number"
                    min={1}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                  />
                </div>
              </div>

              {bonusPct !== null && (
                <p className="text-sm text-[color:var(--chart-2)]">
                  โบนัส: {bonusPct > 0 ? `+${bonusPct}%` : "0%"}
                </p>
              )}

              <div className="space-y-2">
                <Label>Deal Expire</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>ช่องทางส่ง</Label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sendLine}
                    onChange={(e) => setSendLine(e.target.checked)}
                    disabled={!selectedMember?.lineUserId}
                  />
                  LINE {selectedMember && !selectedMember.lineUserId && "(ไม่มี)"}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    disabled={!selectedMember?.email}
                  />
                  Email {selectedMember && !selectedMember.email && "(ไม่มี)"}
                </label>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  const err = validateForm();
                  if (err) {
                    setToast(err);
                    setTimeout(() => setToast(null), 3000);
                    return;
                  }
                  setDialogStep("confirm");
                }}
              >
                ถัดไป — สรุปก่อนส่ง
              </Button>
            </div>
          )}

          {dialogStep === "confirm" && selectedMember && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p><span className="text-muted-foreground">สมาชิก:</span> {selectedMember.name}</p>
                <p><span className="text-muted-foreground">ราคา:</span> {priceNum.toLocaleString()} บาท</p>
                <p><span className="text-muted-foreground">เครดิต:</span> {creditNum.toLocaleString()} ({bonusPct !== null && bonusPct > 0 ? `+${bonusPct}%` : "0%"})</p>
                <p><span className="text-muted-foreground">หมดอายุ:</span> {new Date(expiresAt).toLocaleString("th-TH")}</p>
                <p><span className="text-muted-foreground">ส่งผ่าน:</span> {[sendLine && "LINE", sendEmail && "Email"].filter(Boolean).join(", ")}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDialogStep("form")}>
                  แก้ไข
                </Button>
                <Button className="flex-1" onClick={submitDeal} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ส่ง Deal"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
