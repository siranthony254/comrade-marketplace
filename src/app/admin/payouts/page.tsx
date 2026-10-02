// /admin/payouts — money-out that needs a human. Retrying is deliberately manual.

import { prisma } from "@/lib/prisma";
import { formatKes } from "@/lib/money";
import { timeAgo } from "@/lib/utils";
import { RetryPayout } from "./RetryPayout";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const rows = await prisma.payout.findMany({
    where: { OR: [{ status: "FAILED" }, { status: "PROCESSING", providerRef: null, createdAt: { lt: new Date(Date.now() - 10 * 60_000) } }] },
    orderBy: { createdAt: "asc" },
    include: { order: { select: { orderNumber: true } } },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Payouts needing attention</h1>
        <p className="text-sm text-muted-foreground">
          <strong>Before retrying, open your payment provider&apos;s dashboard and confirm the money did NOT already go out.</strong> A network timeout can hide a payout that actually succeeded — retrying then would pay twice.
        </p>
      </div>
      {rows.length === 0 && <div className="stat-card text-center py-12 text-sm text-muted-foreground">Nothing stuck.</div>}
      {rows.map((p) => (
        <div key={p.id} className="stat-card flex flex-col sm:flex-row sm:items-center gap-3 justify-between text-sm">
          <div className="space-y-0.5">
            <p className="font-semibold">{p.kind === "SELLER_PAYOUT" ? "Seller payout" : "Buyer refund"} · {formatKes(p.amount)}</p>
            <p className="text-muted-foreground">{p.order.orderNumber} → {p.recipient} (+{p.phone}) · {timeAgo(p.createdAt)}</p>
            <p className="text-xs text-red-700">{p.status === "FAILED" ? p.lastError ?? "Failed" : "Sent to the provider but no reference came back — verify manually."}</p>
          </div>
          {p.status === "FAILED" && <RetryPayout payoutId={p.id} />}
        </div>
      ))}
    </div>
  );
}
