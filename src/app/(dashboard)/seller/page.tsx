// /seller — real numbers from the database. No mock data.

import Link from "next/link";
import { AlertCircle, ExternalLink, Package, Plus, ShoppingBag, Star, TrendingUp, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { formatKes } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const { profile } = await requireStudent();
  const business = profile.business;

  if (!business) {
    return (
      <div className="max-w-xl mx-auto stat-card text-center py-12">
        <h1 className="font-display text-2xl font-bold mb-2">Open your storefront</h1>
        <p className="text-sm text-muted-foreground mb-6">Give your business a name and a web address you can share on your WhatsApp status. It takes about 3 minutes.</p>
        <Link href="/seller/storefront" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm"><Plus className="w-4 h-4" />Set up my storefront</Link>
      </div>
    );
  }

  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);
  const done = { businessId: business.id, status: "COMPLETED" as const };

  const [week, month, needAction, inProgress, held, rating, products] = await Promise.all([
    prisma.order.aggregate({ where: { ...done, completedAt: { gte: weekAgo } }, _sum: { sellerPayout: true }, _count: true }),
    prisma.order.aggregate({ where: { ...done, completedAt: { gte: monthAgo } }, _sum: { sellerPayout: true }, _count: true }),
    prisma.order.count({ where: { businessId: business.id, status: "PLACED" } }),
    prisma.order.count({ where: { businessId: business.id, status: { in: ["CONFIRMED", "READY", "DELIVERED"] } } }),
    prisma.order.aggregate({ where: { businessId: business.id, paymentMode: "ESCROW", escrowStatus: "HELD", status: { in: ["PLACED", "CONFIRMED", "READY", "DELIVERED", "DISPUTED"] } }, _sum: { sellerPayout: true } }),
    prisma.review.aggregate({ where: { businessId: business.id }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.product.findMany({ where: { businessId: business.id, isActive: true }, select: { stock: true, lowStockAlert: true } }),
  ]);
  const lowStock = products.filter((p) => p.stock !== null && p.stock <= (p.lowStockAlert ?? 3)).length;

  const stats = [
    { label: "Earned this week", value: formatKes(week._sum.sellerPayout ?? 0), sub: `${week._count} order${week._count === 1 ? "" : "s"}`, icon: TrendingUp },
    { label: "Earned in 30 days", value: formatKes(month._sum.sellerPayout ?? 0), sub: `${month._count} order${month._count === 1 ? "" : "s"}`, icon: Wallet },
    { label: "Held for you", value: formatKes(held._sum.sellerPayout ?? 0), sub: "Paid, awaiting delivery", icon: ShoppingBag },
    { label: "Rating", value: rating._count._all ? `${(rating._avg.rating ?? 0).toFixed(1)} ★` : "—", sub: `${rating._count._all} review${rating._count._all === 1 ? "" : "s"}`, icon: Star },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="comrade-gradient rounded-2xl p-5 sm:p-6 text-white flex items-start justify-between gap-3">
        <div>
          <p className="text-white/80 text-sm">Welcome back</p>
          <h1 className="font-display text-2xl font-bold">{business.name}</h1>
          <p className="text-white/80 text-sm mt-1">{profile.school.name}</p>
        </div>
        <Link href={`/${business.slug}`} target="_blank" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-xs font-medium px-3 py-1.5 rounded-lg shrink-0"><ExternalLink className="w-3.5 h-3.5" />View page</Link>
      </div>

      {(needAction > 0 || lowStock > 0) && (
        <div className="space-y-2">
          {needAction > 0 && (
            <Link href="/seller/orders" className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" /><span><strong>{needAction} new order{needAction === 1 ? "" : "s"}</strong> waiting for you to confirm</span>
            </Link>
          )}
          {lowStock > 0 && (
            <Link href="/seller/products" className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm">
              <Package className="w-5 h-5 shrink-0" /><span><strong>{lowStock} product{lowStock === 1 ? "" : "s"}</strong> running low on stock</span>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <div className="font-display text-xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/seller/orders" className="stat-card"><p className="font-semibold">Orders</p><p className="text-sm text-muted-foreground">{inProgress} in progress</p></Link>
        <Link href="/seller/products" className="stat-card"><p className="font-semibold">Products</p><p className="text-sm text-muted-foreground">{products.length} live listing{products.length === 1 ? "" : "s"}</p></Link>
      </div>
    </div>
  );
}
