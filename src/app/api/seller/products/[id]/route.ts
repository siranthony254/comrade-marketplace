// PATCH  /api/seller/products/:id — edit
// DELETE /api/seller/products/:id — remove (archives instead if it has order history)

import { handle, ok, readJson, ApiError } from "@/lib/api";
import { apiActiveStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";

async function ownProduct(id: string, profileId: string) {
  const p = await prisma.product.findFirst({ where: { id, business: { ownerId: profileId } }, select: { id: true } });
  if (!p) throw new ApiError(404, "Product not found."); // 404 also for other people's products
}

export const PATCH = handle(async (req, { params }) => {
  const { profile } = await apiActiveStudent();
  await ownProduct(params.id, profile.id);
  const data = productSchema.parse(await readJson(req));
  await prisma.product.update({ where: { id: params.id }, data: { ...data, stock: data.type === "PHYSICAL" ? data.stock ?? 0 : null } });
  return ok();
});

export const DELETE = handle(async (_req, { params }) => {
  const { profile } = await apiActiveStudent();
  await ownProduct(params.id, profile.id);
  const used = await prisma.orderItem.count({ where: { productId: params.id } });
  if (used > 0) {
    await prisma.product.update({ where: { id: params.id }, data: { isActive: false } }); // keep order history intact
    return ok({ archived: true });
  }
  await prisma.product.delete({ where: { id: params.id } });
  return ok({ archived: false });
});
