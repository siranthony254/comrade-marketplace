// POST /api/account/phone/confirm  { code }

import { handle, ok, readJson, ApiError } from "@/lib/api";
import { apiUser } from "@/lib/session";
import { otpConfirmSchema } from "@/lib/validations";
import { verifyOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

export const POST = handle(async (req) => {
  const user = await apiUser();
  const { code } = otpConfirmSchema.parse(await readJson(req));
  if (!(await verifyOtp(user.phone, code))) {
    throw new ApiError(400, "That code is wrong or has expired. Request a new one.");
  }
  await prisma.user.update({ where: { id: user.id }, data: { phoneVerifiedAt: new Date() } });
  return ok();
});
