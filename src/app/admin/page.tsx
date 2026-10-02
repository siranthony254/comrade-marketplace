// /admin — what needs a human right now.

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);
  const [pending, disputes, failedPayouts, stuckPayouts, unexpected, students, businesses, completed] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING_REVIEW", role: "STUDENT" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.payout.count({ where: { status: "FAILED" } }),
    prisma.payout.count({ where: { status: "PROCESSING", providerRef: null, createdAt: { lt: new Date(Date.now() - 10 * 60_000) } } }),
    prisma.auditLog.count({ where: { action: "UNEXPECTED_PAYMENT", createdAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    prisma.business.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
  ]);

  const queues = [
    { label: "Students awaiting ID review", n: pending, href: "/admin/verification-queue", urgent: pending > 0 },
    { label: "Open disputes", n: disputes, href: "/admin/disputes", urgent: disputes > 0 },
    { label: "Failed payouts", n: failedPayouts, href: "/admin/payouts", urgent: failedPayouts > 0 },
    { label: "Payouts stuck with no provider reference", n: stuckPayouts, href: "/admin/payouts", urgent: stuckPayouts > 0 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Admin</h1>
      <div className="grid sm:grid-cols-2 gap-3">
        {queues.map((q) => (
          <Link key={q.label} href={q.href} className={`stat-card ${q.urgent ? "border-amber-300 bg-amber-50" : ""}`}>
            <div className="font-display text-3xl font-bold">{q.n}</div><div className="text-sm text-muted-foreground">{q.label}</div>
          </Link>
        ))}
      </div>
      {unexpected > 0 && <p className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-xl p-4"><strong>{unexpected} unexpected payment{unexpected === 1 ? "" : "s"}</strong> in the last 30 days (a payment landed on an order that had already moved on, e.g. paid twice). Check the audit log and the provider dashboard — no automatic refund was made.</p>}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[{ l: "Verified students", v: students }, { l: "Live businesses", v: businesses }, { l: "Completed orders", v: completed }].map((s) => <div key={s.l} className="stat-card"><div className="font-display text-2xl font-bold">{s.v}</div><div className="text-xs text-muted-foreground">{s.l}</div></div>)}
      </div>
    </div>
  );
}
