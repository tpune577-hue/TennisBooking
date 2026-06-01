"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { UserCheck, AlertCircle, Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface Coach {
  id: string;
  pricePerHour: number;
  bio: string | null;
  isAvailable: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string | null; avatarUrl: string | null; role: string };
}

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Coach | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ userId: "", pricePerHour: "300", bio: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coaches");
      const data = await res.json();
      setCoaches(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function toggleAvailable(coach: Coach) {
    const res = await fetch(`/api/admin/coaches/${coach.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !coach.isAvailable }),
    });
    if (res.ok) { showToast("อัปเดตสำเร็จ", true); load(); }
    else showToast("เกิดข้อผิดพลาด", false);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/coaches/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerHour: parseInt(form.pricePerHour),
          bio: form.bio || undefined,
        }),
      });
      if (res.ok) {
        showToast("บันทึกสำเร็จ", true);
        setEditTarget(null);
        load();
      } else {
        const d = await res.json();
        showToast(d.error ?? "เกิดข้อผิดพลาด", false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function createCoach() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          pricePerHour: parseInt(form.pricePerHour),
          bio: form.bio || undefined,
        }),
      });
      if (res.ok) {
        showToast("สร้าง coach สำเร็จ", true);
        setShowCreate(false);
        setForm({ userId: "", pricePerHour: "300", bio: "" });
        load();
      } else {
        const d = await res.json();
        showToast(d.error ?? "เกิดข้อผิดพลาด", false);
      }
    } finally {
      setSaving(false);
    }
  }

  function openEdit(c: Coach) {
    setForm({ userId: c.user.id, pricePerHour: String(c.pricePerHour), bio: c.bio ?? "" });
    setEditTarget(c);
  }

  const availableCount = coaches.filter((c) => c.isAvailable).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">จัดการ Coach</h1>
        <Button size="sm" onClick={() => { setForm({ userId: "", pricePerHour: "300", bio: "" }); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          เพิ่ม Coach
        </Button>
      </div>

      {toast && (
        <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${toast.ok ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {toast.msg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Coach ทั้งหมด</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coaches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">พร้อมรับงาน</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{availableCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coach</TableHead>
              <TableHead>ราคา/ชม.</TableHead>
              <TableHead>Bio</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell>
              </TableRow>
            ) : coaches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ยังไม่มี Coach</TableCell>
              </TableRow>
            ) : (
              coaches.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {c.user.avatarUrl ? (
                        <img src={c.user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {c.user.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{c.user.name}</p>
                        {c.user.email && <p className="text-xs text-muted-foreground">{c.user.email}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{c.pricePerHour.toLocaleString()} เครดิต</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-48 truncate">
                    {c.bio ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.isAvailable ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {c.isAvailable ? "พร้อม" : "ไม่พร้อม"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleAvailable(c)}
                        title={c.isAvailable ? "ตั้งเป็นไม่พร้อม" : "ตั้งเป็นพร้อม"}
                      >
                        {c.isAvailable ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        แก้ไข
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไข Coach — {editTarget?.user.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ราคาต่อชั่วโมง (เครดิต)</Label>
              <Input
                type="number"
                min={100}
                value={form.pricePerHour}
                onChange={(e) => setForm((f) => ({ ...f, pricePerHour: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bio (ประวัติโค้ช)</Label>
              <Input
                placeholder="ประวัติ/ความเชี่ยวชาญ"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditTarget(null)}>ยกเลิก</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่ม Coach ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>User ID</Label>
              <Input
                placeholder="UUID ของผู้ใช้"
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">นำ UUID ของผู้ใช้ที่ต้องการตั้งเป็น coach จากตาราง Members</p>
            </div>
            <div className="space-y-1.5">
              <Label>ราคาต่อชั่วโมง (เครดิต)</Label>
              <Input
                type="number"
                min={100}
                value={form.pricePerHour}
                onChange={(e) => setForm((f) => ({ ...f, pricePerHour: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Input
                placeholder="ประวัติ/ความเชี่ยวชาญ"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
              <Button onClick={createCoach} disabled={saving || !form.userId}>{saving ? "กำลังสร้าง..." : "สร้าง"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
