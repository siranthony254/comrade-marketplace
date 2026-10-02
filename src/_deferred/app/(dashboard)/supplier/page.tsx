// DEFERRED (Phase 3) — reconstructed from build output after an accidental deletion.
// Route: /supplier
// SUPPLIER HOME — reliability score, order/escrow stats, cross-promotion panels.

import Link from "next/link";
import { TrendingUp, Package, ShoppingBag, Star, AlertCircle, Briefcase } from "lucide-react";

// TODO: Replace with real data from GET /api/supplier/dashboard
const MOCK = {
  businessName: "Karibu Wholesale Ltd",
  tier: "REGIONAL",
  reliabilityScore: 87,
  pendingOrders: 5,
  monthlyRevenue: 142000,
  avgRating: 4.5,
  strikeCount: 0,
  escrowPending: 28400,
};

export default function SupplierDashboardPage() {
  const scoreColor =
    MOCK.reliabilityScore >= 85 ? "text-green-600 bg-green-50 border-green-200"
    : MOCK.reliabilityScore >= 70 ? "text-yellow-600 bg-yellow-50 border-yellow-200"
    : MOCK.reliabilityScore >= 50 ? "text-orange-600 bg-orange-50 border-orange-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{MOCK.businessName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {MOCK.tier} SUPPLIER
            </span>
            <span className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${scoreColor}`}>
              Reliability: {MOCK.reliabilityScore}/100
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue", value: `KES ${MOCK.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-primary", bg: "bg-accent", href: "/supplier/analytics" },
          { label: "Pending Orders", value: MOCK.pendingOrders, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50", href: "/supplier/orders" },
          { label: "In Escrow", value: `KES ${MOCK.escrowPending.toLocaleString()}`, icon: Package, color: "text-blue-600", bg: "bg-blue-50", href: "/supplier/orders" },
          { label: "Avg Rating", value: `${MOCK.avgRating}★`, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", href: "/supplier/analytics" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="stat-card hover:scale-[1.01] transition-transform">
            <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <div className="font-display text-xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Reliability Score Breakdown</h2>
          <Link href="/supplier/analytics" className="text-xs text-primary hover:underline">Full analytics →</Link>
        </div>
        {[
          { label: "On-time Delivery", value: 90, weight: "30%" },
          { label: "Order Accuracy", value: 95, weight: "25%" },
          { label: "Low Dispute Rate", value: 98, weight: "20%" },
          { label: "Customer Ratings", value: 88, weight: "15%" },
          { label: "Response Time", value: 75, weight: "10%" },
        ].map((m) => (
          <div key={m.label} className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{m.label}</span>
              <span className="text-muted-foreground">{m.value}% (weight: {m.weight})</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${m.value >= 85 ? "bg-green-500" : m.value >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ Score below 50 triggers suspension. Below 70 shows an &quot;Under Watch&quot; badge to comrades.
        </p>
      </div>

      {MOCK.strikeCount > 0 ? (
        <div className="stat-card border-red-200 bg-red-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">
                {MOCK.strikeCount} Strike{MOCK.strikeCount > 1 ? "s" : ""} on record
              </p>
              <p className="text-xs text-red-700 mt-0.5">3 strikes = permanent removal. Contact support to discuss.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="stat-card border-green-200 bg-green-50">
          <p className="text-sm text-green-800 font-medium">✅ No strikes on record. Keep up the good work!</p>
        </div>
      )}

      <div className="stat-card border-l-4 border-l-secondary">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold">Need branding or marketing?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Post a brief and hire talented student designers, photographers, or writers. Escrow protects you both.
              </p>
            </div>
          </div>
          <Link
            href="/supplier/services"
            className="text-xs font-semibold bg-secondary text-white px-3 py-1.5 rounded-lg hover:bg-secondary/90 transition-colors shrink-0 ml-4"
          >
            Post Brief →
          </Link>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Top Student Businesses on Platform</h3>
          <Link href="/buyer/discover" className="text-xs text-primary hover:underline">Explore all →</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          These businesses are your potential wholesale customers. They have high order volumes and growing revenue — reach out via the platform messaging system.
        </p>
        <div className="mt-3 space-y-2">
          {[
            "Jane's Kitchen — Food & Beverages — UoN",
            "PrintMaster KE — Printing — JKUAT",
            "TechFix Campus — Electronics — Strathmore",
          ].map((b) => (
            <div key={b} className="text-xs p-2 bg-muted/50 rounded-lg font-medium">{b}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
