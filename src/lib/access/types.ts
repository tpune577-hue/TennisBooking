export type AccessPassRole = "host" | "guest" | "coach";
export type AccessPresence = "outside" | "inside";
export type AccessPassStatus = "active" | "revoked";

export type ClubAccessSettings = {
  id: string;
  enabled: boolean;
  graceMinutesBefore: number;
  graceMinutesAfter: number;
  maxParticipantsPerBooking: number;
  resetAllowedRoles: string[];
  requireResetReason: boolean;
};

export type AccessWindow = {
  validFrom: Date;
  validUntil: Date;
  now: Date;
  phase: "before" | "active" | "after";
};
