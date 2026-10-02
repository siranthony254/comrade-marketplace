// src/lib/queries.ts — read queries shared by several pages.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface BusinessFilters { q?: string; category?: string; schoolId?: string }

/** Public, visible businesses only: admin-active, owner approved, and at least one live listing. */
export async function listBusinesses(f: BusinessFilters) {
  const q = f.q?.trim();
  const where: Prisma.BusinessWhereInput = {
    isActive: true,
    owner: { user: { status: "ACTIVE" } },
    products: { some: { isActive: true } },
    ...(f.category ? { category: f.category } : {}),
    ...(f.schoolId ? { schoolId: f.schoolId } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { tagline: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
  };

  const rows = await prisma.business.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 48,
    include: { school: { select: { shortName: true } }, _count: { select: { products: { where: { isActive: true } } } } },
  });

  const ratings = await prisma.review.groupBy({
    by: ["businessId"],
    where: { businessId: { in: rows.map((r) => r.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const byId = new Map(ratings.map((r) => [r.businessId, { avg: r._avg.rating ?? 0, count: r._count._all }]));

  return rows.map((b) => ({ ...b, rating: byId.get(b.id) ?? { avg: 0, count: 0 } }));
}

export function listSchools() {
  return prisma.school.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, shortName: true } });
}

/** "Brian Omondi" -> "Brian O." so public reviews don't expose full names. */
export function publicName(fullName: string): string {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1]![0]!.toUpperCase()}.` : first ?? "Comrade";
}
