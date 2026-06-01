"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Court = {
  id: string;
  name: string;
  type: "outdoor" | "indoor" | "clay";
  description: string | null;
  isActive: boolean;
  openTime: string;
  closeTime: string;
  sortOrder: number;
  pricing: {
    peakPricePerHour: number;
    offPeakPricePerHour: number;
    peakStartTime: string;
    peakEndTime: string;
  } | null;
};

interface CourtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  court: Court | null;
  onSaved: (court: Court) => void;
}

const DEFAULT_FORM = {
  name: "",
  type: "indoor" as "outdoor" | "indoor" | "clay",
  openTime: "06:00",
  closeTime: "22:00",
  peakPricePerHour: 250,
  offPeakPricePerHour: 180,
  peakStartTime: "17:00",
  peakEndTime: "21:00",
};

export function CourtFormDialog({ open, onOpenChange, court, onSaved }: CourtFormDialogProps) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const isEdit = !!court;

  useEffect(() => {
    if (court) {
      setForm({
        name: court.name,
        type: court.type,
        openTime: court.openTime,
        closeTime: court.closeTime,
        peakPricePerHour: court.pricing?.peakPricePerHour ?? 250,
        offPeakPricePerHour: court.pricing?.offPeakPricePerHour ?? 180,
        peakStartTime: court.pricing?.peakStartTime ?? "17:00",
        peakEndTime: court.pricing?.peakEndTime ?? "21:00",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [court, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        // Update court info
        const courtRes = await fetch(`/api/admin/courts/${court.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, type: form.type as string, openTime: form.openTime, closeTime: form.closeTime }),
        });
        // Update pricing
        await fetch(`/api/admin/courts/${court.id}/pricing`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            peakPricePerHour: form.peakPricePerHour,
            offPeakPricePerHour: form.offPeakPricePerHour,
            peakStartTime: form.peakStartTime,
            peakEndTime: form.peakEndTime,
          }),
        });

        if (courtRes.ok) {
          onSaved({ ...court!, ...form, pricing: { peakPricePerHour: form.peakPricePerHour, offPeakPricePerHour: form.offPeakPricePerHour, peakStartTime: form.peakStartTime, peakEndTime: form.peakEndTime } });
          toast.success("บันทึกสนามเรียบร้อย");
          onOpenChange(false);
        }
      } else {
        const res = await fetch("/api/admin/courts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const newCourt = await res.json();
          onSaved({ ...newCourt, pricing: { peakPricePerHour: form.peakPricePerHour, offPeakPricePerHour: form.offPeakPricePerHour, peakStartTime: form.peakStartTime, peakEndTime: form.peakEndTime } });
          toast.success("เพิ่มสนามเรียบร้อย");
          onOpenChange(false);
        }
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (val: string | number) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "แก้ไขสนาม" : "เพิ่มสนามใหม่"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อสนาม</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="เช่น Indoor 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>ประเภทสนาม</Label>
            <Select value={form.type} onValueChange={(v) => set("type")(v ?? "indoor")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outdoor">Outdoor</SelectItem>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="clay">Clay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="openTime">เวลาเปิด</Label>
              <Input id="openTime" type="time" value={form.openTime} onChange={(e) => set("openTime")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closeTime">เวลาปิด</Label>
              <Input id="closeTime" type="time" value={form.closeTime} onChange={(e) => set("closeTime")(e.target.value)} />
            </div>
          </div>

          <Separator />
          <p className="text-sm font-medium text-foreground">ราคา (credits / ชั่วโมง)</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="peakPrice">Peak</Label>
              <Input
                id="peakPrice"
                type="number"
                value={form.peakPricePerHour}
                onChange={(e) => set("peakPricePerHour")(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offPeakPrice">Off-Peak</Label>
              <Input
                id="offPeakPrice"
                type="number"
                value={form.offPeakPricePerHour}
                onChange={(e) => set("offPeakPricePerHour")(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="peakStart">Peak เริ่ม</Label>
              <Input id="peakStart" type="time" value={form.peakStartTime} onChange={(e) => set("peakStartTime")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peakEnd">Peak สิ้นสุด</Label>
              <Input id="peakEnd" type="time" value={form.peakEndTime} onChange={(e) => set("peakEndTime")(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
