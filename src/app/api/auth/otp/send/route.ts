// POST /api/auth/otp/send  { phone }
// Sends a 6-digit code to prove phone ownership during registration.

import { z } from "zod";
import { handle, ok, readJson, ApiError } from "@/lib/api";
import { phoneSchema } from "@/lib/validations";
import { sendOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

export const POST = handle(async (req) => {
  const { phone } = z.object({ phone: phoneSchema }).parse(await readJson(req));

  // Tell the user early if the number is taken, rather than after they've filled in the whole form.
  const taken = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
  if (taken) throw new ApiError(409, "That phone number already has an account. Try signing in.");

  const { devCode } = await sendOtp(phone);
  return ok({ sent: true, ...(devCode ? { devCode } : {}) });
});
