"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MemberProfileFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: "male" | "female" | "unspecified" | "";
};

const GENDER_OPTIONS = [
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "unspecified", label: "ไม่ระบุ" },
] as const;

type MemberProfileFormProps = {
  values: MemberProfileFormValues;
  onChange: (values: MemberProfileFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  phoneReadOnly?: boolean;
};

export function MemberProfileForm({
  values,
  onChange,
  onSubmit,
  submitLabel,
  loading,
  error,
  phoneReadOnly,
}: MemberProfileFormProps) {
  function set<K extends keyof MemberProfileFormValues>(
    key: K,
    value: MemberProfileFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">ชื่อ</Label>
          <Input
            id="firstName"
            value={values.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            required
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">นามสกุล</Label>
          <Input
            id="lastName"
            value={values.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            required
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">เบอร์โทร</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
          readOnly={phoneReadOnly}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">วันเดือนปีเกิด</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={values.dateOfBirth}
          onChange={(e) => set("dateOfBirth", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>เพศ</Label>
        <Select
          value={values.gender || undefined}
          onValueChange={(v) =>
            set("gender", v as MemberProfileFormValues["gender"])
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกเพศ" />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "กำลังดำเนินการ..." : submitLabel}
      </Button>
    </form>
  );
}
