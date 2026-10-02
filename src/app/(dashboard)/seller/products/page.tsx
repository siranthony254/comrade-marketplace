// /seller/products

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { PLATFORM } from "@/lib/constants/platform";
import { ProductManager } from "./ProductManager";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { user, profile } = await requireStudent();
  if (!profile.business) {
    return (
      <div className="max-w-xl mx-auto stat-card text-center py-10">
        <p className="font-semibold mb-2">Set up your storefront first</p>
        <Link href="/seller/storefront" className="text-primary text-sm hover:underline">Go to storefront →</Link>
      </div>
    );
  }
  const products = await prisma.product.findMany({ where: { businessId: profile.business.id }, orderBy: { createdAt: "desc" } });
  return (
    <ProductManager
      canEdit={user.status === "ACTIVE"}
      limit={PLATFORM.limits.maxProductsFree}
      products={products.map((p) => ({ id: p.id, name: p.name, description: p.description, type: p.type, price: p.price, costPrice: p.costPrice, stock: p.stock, lowStockAlert: p.lowStockAlert, turnaroundDays: p.turnaroundDays, images: p.images, isActive: p.isActive }))}
    />
  );
}
