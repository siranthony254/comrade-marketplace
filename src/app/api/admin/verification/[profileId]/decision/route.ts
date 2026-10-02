// POST /api/admin/verification/:profileId/decision  { decision: "APPROVE" | "REJECT", note? }
//
// APPROVE: account becomes ACTIVE; verification is valid for PLATFORM.verification.validityMonths.
// REJECT : the applicant is told why (SMS), their ID photo + selfie are DELETED, and the signup is
//          removed so they can re-apply with better photos. We don't keep identity documents we don't need.

import { z } from "zod";
import { handle, ok, readJson, ApiError } from "@/lib/api";
import { apiAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { deletePrivateImage } from "@/lib/storage";
import { sendSms } from "@/lib/sms";
import { PLATFORM } from "@/lib/constants/platform";

const schema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE") }),
  z.object({ decision: z.literal("REJECT"), note: z.string().trim().min(3, "Give the student a reason.").max(200) }),
]);

export const POST = handle(async (req, { params }) => {
  const admin = await apiAdmin();
  const body = schema.parse(await readJson(req));

  const profile = await prisma.studentProfile.findUnique({ where: { id: params.profileId }, include: { user: true } });
  if (!profile) throw new ApiError(404, "Applicant not found.");
  if (profile.user.status !== "PENDING_REVIEW") throw new ApiError(409, "This applicant has already been reviewed.");

  if (body.decision === "APPROVE") {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + PLATFORM.verification.validityMonths);
    await prisma.$transaction([
      prisma.user.update({ where: { id: profile.userId }, data: { status: "ACTIVE" } }),
      prisma.studentProfile.update({ where: { id: profile.id }, data: { verifiedAt: new Date(), verificationExpiresAt: expires, reviewedById: admin.id } }),
      prisma.notification.create({ data: { userId: profile.userId, type: "SYSTEM", title: "You're verified! 🎉", body: "Your student ID was approved. You can now buy and sell on Comrade Market.", link: "/seller" } }),
      prisma.auditLog.create({ data: { actorId: admin.id, action: "STUDENT_APPROVED", entityType: "StudentProfile", entityId: profile.id } }),
    ]);
    return ok();
  }

  // REJECT — tell them first (needs their phone), then remove the sensitive data.
  await sendSms(profile.user.phone, `Comrade Market: we couldn't verify your student ID (${body.note}). Please sign up again with clear photos.`).catch((e) =>
    console.error("[admin] rejection SMS failed", e),
  );
  await Promise.all([profile.idPhotoKey, profile.selfieKey].filter((k): k is string => !!k).map(deletePrivateImage));
  await prisma.$transaction([
    prisma.auditLog.create({ data: { actorId: admin.id, action: "STUDENT_REJECTED", entityType: "StudentProfile", entityId: profile.id, metadata: { reason: body.note } } }),
    prisma.user.delete({ where: { id: profile.userId } }), // cascades to the profile
  ]);
  return ok();
});
