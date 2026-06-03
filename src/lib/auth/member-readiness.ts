export type Gender = "male" | "female" | "unspecified";

export type MemberReadinessInput = {
  role: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | Date | null;
  gender: Gender | null;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lineUserId: string | null;
};

const STAFF_ROLES = ["super_admin", "staff", "coach_employee", "coach_freelance"];

export function isProfileComplete(user: MemberReadinessInput): boolean {
  if (STAFF_ROLES.includes(user.role)) return true;
  return Boolean(
    user.firstName?.trim() &&
      user.lastName?.trim() &&
      user.phone?.trim() &&
      user.email?.trim() &&
      user.dateOfBirth &&
      user.gender,
  );
}

export function hasVerifiedChannel(user: MemberReadinessInput): boolean {
  return user.isPhoneVerified || user.isEmailVerified || Boolean(user.lineUserId);
}

export type MemberOnboardingStatus = {
  profileComplete: boolean;
  hasVerifiedChannel: boolean;
  canBook: boolean;
  channels: {
    phone: { linked: boolean; verified: boolean };
    email: { linked: boolean; verified: boolean };
    line: { linked: boolean; verified: boolean };
  };
};

export function getMemberOnboardingStatus(
  user: MemberReadinessInput,
): MemberOnboardingStatus {
  const profileComplete = isProfileComplete(user);
  const verified = hasVerifiedChannel(user);
  return {
    profileComplete,
    hasVerifiedChannel: verified,
    canBook: profileComplete && verified,
    channels: {
      phone: {
        linked: Boolean(user.phone),
        verified: user.isPhoneVerified,
      },
      email: {
        linked: Boolean(user.email),
        verified: user.isEmailVerified,
      },
      line: {
        linked: Boolean(user.lineUserId),
        verified: Boolean(user.lineUserId),
      },
    },
  };
}

export function assertMemberCanBook(
  user: MemberReadinessInput,
): { ok: true } | { ok: false; code: "PROFILE_INCOMPLETE" | "VERIFICATION_REQUIRED"; message: string } {
  if (!isProfileComplete(user)) {
    return {
      ok: false,
      code: "PROFILE_INCOMPLETE",
      message: "กรุณากรอกข้อมูลสมาชิกให้ครบก่อนจอง",
    };
  }
  if (!hasVerifiedChannel(user)) {
    return {
      ok: false,
      code: "VERIFICATION_REQUIRED",
      message: "กรุณายืนยันตัวตนอย่างน้อยหนึ่งช่องทาง (เบอร์โทร อีเมล หรือ LINE)",
    };
  }
  return { ok: true };
}

export function loadReadinessColumns() {
  return {
    role: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    dateOfBirth: true,
    gender: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    lineUserId: true,
  } as const;
}
