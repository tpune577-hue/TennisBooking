/** When false, only existing member records may sign in (private club). */
export function allowMemberSelfSignup(): boolean {
  return process.env.ALLOW_MEMBER_SELF_SIGNUP === "true";
}
