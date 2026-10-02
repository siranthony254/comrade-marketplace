// GET /api/admin/verification/:profileId/:kind   (kind = id | selfie)
// Streams a student's PRIVATE verification photo. Admin only; never cached.

import { NextResponse } from "next/server";
import { handle, ApiError } from "@/lib/api";
import { apiAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readPrivateImage } from "@/lib/storage";

export const GET = handle(async (_req, { params }) => {
  const admin = await apiAdmin();
  const profile = await prisma.studentProfile.findUnique({
    where: { id: params.profileId },
    select: { idPhotoKey: true, selfieKey: true },
  });
  const key = params.kind === "id" ? profile?.idPhotoKey : params.kind === "selfie" ? profile?.selfieKey : null;
  if (!key) throw new ApiError(404, "Not found.");

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "VIEW_ID_PHOTO", entityType: "StudentProfile", entityId: params.profileId, metadata: { kind: params.kind } },
  });

  const image = await readPrivateImage(key);
  return new NextResponse(new Uint8Array(image), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
});
