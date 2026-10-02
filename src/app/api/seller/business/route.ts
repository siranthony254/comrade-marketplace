// PUT /api/seller/business — create the caller's storefront, or update it.
// The web address (slug) is chosen once and then frozen: changing it would break every link
// the seller has already shared on WhatsApp.

import { Prisma } from "@prisma/client";
import { handle, ok, readJson, ApiError } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { businessSchema, isSlugAvailableShape } from "@/lib/validations";

export const PUT = handle(async (req) => {
  const { profile } = await apiActiveStudent();
  const data = businessSchema.parse(await readJson(req));
  const { slug, ...editable } = data;

  const existing = await prisma.business.findUnique({ where: { ownerId: profile.id } });

  if (existing) {
    const updated = await prisma.business.update({ where: { id: existing.id }, data: editable });
    return ok({ slug: updated.slug });
  }

  const shape = isSlugAvailableShape(slug);
  if (!shape.ok) throw new ApiError(400, shape.reason);

  try {
    const created = await prisma.business.create({ data: { ...editable, slug, ownerId: profile.id, schoolId: profile.schoolId } });
    return ok({ slug: created.slug }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ApiError(409, "That web address is taken. Try another.");
    }
    throw e;
  }
});
