// POST /api/seller/products — add a product or service to the caller's storefront.

import { handle, ok, readJson, ApiError } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { PLATFORM } from "@/lib/constants/platform";

export const POST = handle(async (req) => {
  const { profile } = await apiActiveStudent();
  const business = await prisma.business.findUnique({ where: { ownerId: profile.id }, select: { id: true } });
  if (!business) throw new ApiError(409, "Set up your storefront first.");

  const data = productSchema.parse(await readJson(req));

  const count = await prisma.product.count({ where: { businessId: business.id } });
  if (count >= PLATFORM.limits.maxProductsFree) {
    throw new ApiError(403, `The free plan allows ${PLATFORM.limits.maxProductsFree} listings. Remove one to add another.`);
  }

  const product = await prisma.product.create({
    data: { ...data, businessId: business.id, stock: data.type === "PHYSICAL" ? data.stock ?? 0 : null },
  });
  return ok({ id: product.id }, { status: 201 });
});
