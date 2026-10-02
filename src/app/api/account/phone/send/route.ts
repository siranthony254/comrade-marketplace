// POST /api/account/phone/send — send a code to the CALLER's own account phone.
// Self-service, optional, any time after signup. Never blocks using the platform.

import { handle, ok } from "@/lib/api";
import { apiUser } from "@/lib/session";
import { sendOtp } from "@/lib/otp";

export const POST = handle(async () => {
  const user = await apiUser();
  const { devCode } = await sendOtp(user.phone);
  return ok({ sent: true, ...(devCode ? { devCode } : {}) });
});
