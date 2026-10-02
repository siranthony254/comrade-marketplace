// src/lib/otp.ts
// Phone ownership proof. Needed because M-Pesa payouts and STK pushes go to this number:
// paying out to a number the user never proved they own is how money gets misdirected.

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { PLATFORM } from "@/lib/constants/platform";
import { sendSms, smsIsConfigured } from "@/lib/sms";
import { ApiError } from "@/lib/api";

function hashCode(phone: string, code: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

/** Sends a code. Returns the code ONLY in development with no SMS provider, so the flow is testable offline. */
export async function sendOtp(phone: string): Promise<{ devCode?: string }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.phoneOtp.count({ where: { phone, createdAt: { gte: oneHourAgo } } });
  if (recent >= PLATFORM.otp.maxSendsPerHour) {
    throw new ApiError(429, "Too many codes requested. Please wait a while and try again.");
  }

  const code = String(randomInt(0, 10 ** PLATFORM.otp.length)).padStart(PLATFORM.otp.length, "0");
  await prisma.phoneOtp.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(Date.now() + PLATFORM.otp.ttlMinutes * 60 * 1000),
    },
  });
  await sendSms(phone, `Your Comrade Market code is ${code}. It expires in ${PLATFORM.otp.ttlMinutes} minutes. Never share it.`);

  return process.env.NODE_ENV !== "production" && !smsIsConfigured ? { devCode: code } : {};
}

/** Checks the newest live code for this phone. Consumes it on success. Wrong guesses are counted. */
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const otp = await prisma.phoneOtp.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= PLATFORM.otp.maxAttempts) return false;

  const a = Buffer.from(hashCode(phone, code));
  const b = Buffer.from(otp.codeHash);
  const match = a.length === b.length && timingSafeEqual(a, b);

  if (!match) {
    await prisma.phoneOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  // Consume atomically: only one concurrent request can win.
  const res = await prisma.phoneOtp.updateMany({ where: { id: otp.id, consumedAt: null }, data: { consumedAt: new Date() } });
  return res.count === 1;
}
