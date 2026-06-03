"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  MemberProfileForm,
  type MemberProfileFormValues,
} from "@/components/auth/member-profile-form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Wallet, Users, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface Member {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: "male" | "female" | "unspecified" | null;
  role: string;
  creditBalance: number;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lineUserId: string | null;
  createdAt: string;
  avatarUrl: string | null;
  tier: { name: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  customer: "ลูกค้า",
  coach_employee: "โค้ช (พนักงาน)",
  coach_freelance: "โค้ช (ฟรีแลนซ์)",
  staff: "พนักงาน",
  super_admin: "ผู้ดูแล",
};

function memberToForm(m: Member): MemberProfileFormValues {
  const parts = m.name.trim().split(/\s+/);
  return {
    firstName: m.firstName ?? parts[0] ?? "",
    lastName: m.lastName ?? parts.slice(1).join(" ") ?? "",
    phone: m.phone?.replace(/^\+66/, "0") ?? "",
    email: m.email ?? "",
    dateOfBirth: m.dateOfBirth?.slice(0, 10) ?? "",
    gender: m.gender ?? "",
  };
}

export default function MembersPage() {
  const { data: session } = useSession();
  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "super_admin";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<Member | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<MemberProfileFormValues | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const url = `/api/admin/members${search ? `?q=${encodeURIComponent(search)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    load(q);
  }

  async function submitProfileEdit() {
    if (!editTarget || !editForm) return;
    if (!editForm.gender) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/admin/members/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setToast("บันทึกข้อมูลสมาชิกแล้ว");
        setEditTarget(null);
        setEditForm(null);
        load(q);
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(data.error ?? "บันทึกไม่สำเร็จ");
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitAdjust() {
    if (!adjustTarget) return;
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) return;
    setAdjusting(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: adjustTarget.id, amount, description: adjustNote || `ปรับยอดโดย admin` }),
      });
      if (res.ok) {
        const data = await res.json();
        const lineMsg =
          data.lineNotification?.sent
            ? " · ส่งแจ้งเตือน LINE แล้ว"
            : data.lineNotification?.reason
              ? ` · ไม่ได้ส่ง LINE (${data.lineNotification.reason})`
              : "";
        setToast(`ปรับยอดเครดิตสำเร็จ${lineMsg}`);
        setAdjustTarget(null);
        setAdjustAmount("");
        setAdjustNote("");
        load(q);
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setAdjusting(false);
    }
  }

  const totalMembers = members.filter((m) => m.role === "customer").length;
  const totalCredits = members.reduce((s, m) => s + m.creditBalance, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">สมาชิก</h1>

      {toast && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 p-3 text-sm">
          {toast}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">สมาชิกทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เครดิตรวมในระบบ</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">ค้นหา</Button>
      </form>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ติดต่อ</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead>ระดับ</TableHead>
              <TableHead className="text-right">เครดิต</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  ไม่พบสมาชิก
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {m.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        {!m.isActive && <Badge variant="destructive" className="text-xs">ระงับ</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {m.email && <p>{m.email}</p>}
                      {m.phone && <p>{m.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {m.tier?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    {m.creditBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {isSuperAdmin && m.role === "customer" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => {
                          setEditTarget(m);
                          setEditForm(memberToForm(m));
                        }}
                      >
                        แก้ข้อมูล
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setAdjustTarget(m)}
                    >
                      ปรับเครดิต
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) {
            setEditTarget(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ข้อมูลสมาชิก — {editTarget?.name}</DialogTitle>
          </DialogHeader>
          {editForm ? (
            <MemberProfileForm
              values={editForm}
              onChange={setEditForm}
              onSubmit={submitProfileEdit}
              submitLabel="บันทึก"
              loading={savingProfile}
            />
          ) : null}
          <p className="text-xs text-muted-foreground">
            สถานะยืนยัน (OTP/อีเมล/LINE) เปลี่ยนได้เฉพาะเมื่อสมาชิกทำ flow เอง
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปรับยอดเครดิต — {adjustTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              เครดิตปัจจุบัน: <span className="font-semibold text-foreground">{adjustTarget?.creditBalance.toLocaleString()}</span>
            </div>
            <div className="space-y-1.5">
              <Label>จำนวนเครดิต (ใส่ - เพื่อหัก)</Label>
              <Input
                type="number"
                placeholder="เช่น 500 หรือ -200"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Input
                placeholder="เหตุผลในการปรับยอด"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
              />
            </div>
            {adjustAmount && !isNaN(parseInt(adjustAmount)) && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                ยอดหลังปรับ:{" "}
                <span className="font-semibold">
                  {Math.max(0, (adjustTarget?.creditBalance ?? 0) + parseInt(adjustAmount)).toLocaleString()}
                </span>{" "}
                เครดิต
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAdjustTarget(null)}>ยกเลิก</Button>
              <Button onClick={submitAdjust} disabled={adjusting || !adjustAmount}>
                {adjusting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
