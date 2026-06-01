"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourtFormDialog } from "./court-form-dialog";
import { Plus, Pencil, PowerOff, Power } from "lucide-react";
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

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  outdoor: { label: "Outdoor", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  indoor: { label: "Indoor", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  clay: { label: "Clay", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
};

export function CourtsPageClient({ initialCourts }: { initialCourts: Court[] }) {
  const [courts, setCourts] = useState<Court[]>(initialCourts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  const handleToggleActive = async (court: Court) => {
    const res = await fetch(`/api/admin/courts/${court.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !court.isActive }),
    });

    if (res.ok) {
      setCourts((prev) =>
        prev.map((c) => (c.id === court.id ? { ...c, isActive: !c.isActive } : c))
      );
      toast.success(court.isActive ? "ปิดสนามแล้ว" : "เปิดสนามแล้ว");
    } else {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleSaved = (savedCourt: Court) => {
    setCourts((prev) => {
      const existing = prev.find((c) => c.id === savedCourt.id);
      if (existing) return prev.map((c) => (c.id === savedCourt.id ? savedCourt : c));
      return [...prev, savedCourt];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">จัดการสนาม</h1>
          <p className="text-sm text-muted-foreground mt-1">
            สนามทั้งหมด {courts.length} สนาม · เปิดอยู่ {courts.filter((c) => c.isActive).length} สนาม
          </p>
        </div>
        <Button
          onClick={() => { setEditingCourt(null); setDialogOpen(true); }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          เพิ่มสนาม
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courts.map((court) => {
          const typeInfo = TYPE_LABELS[court.type];
          return (
            <div
              key={court.id}
              className={`rounded-lg border bg-card p-5 space-y-4 transition-opacity ${!court.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{court.name}</h3>
                    {!court.isActive && (
                      <Badge variant="destructive" className="text-xs">ปิด</Badge>
                    )}
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditingCourt(court); setDialogOpen(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleActive(court)}
                  >
                    {court.isActive
                      ? <PowerOff className="h-4 w-4 text-destructive" />
                      : <Power className="h-4 w-4 text-green-500" />
                    }
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>เวลาเปิด-ปิด</span>
                  <span className="font-medium text-foreground">{court.openTime} – {court.closeTime}</span>
                </div>
                {court.pricing && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>ราคา Peak</span>
                      <span className="font-medium text-foreground tabular-nums">
                        {court.pricing.peakPricePerHour} credit/ชม.
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>ราคา Off-Peak</span>
                      <span className="font-medium text-foreground tabular-nums">
                        {court.pricing.offPeakPricePerHour} credit/ชม.
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Peak time</span>
                      <span className="font-medium text-foreground">
                        {court.pricing.peakStartTime} – {court.pricing.peakEndTime}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CourtFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        court={editingCourt}
        onSaved={handleSaved}
      />
    </div>
  );
}
