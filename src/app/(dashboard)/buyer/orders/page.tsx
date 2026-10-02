// /buyer/orders — my purchases. ?pay=<orderId> opens the payment-waiting panel; ?placed=<number> shows a confirmation.

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { formatKes } from "@/lib/money";
import { timeAgo } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { BuyerOrderActions } from "./BuyerOrderActions";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage({ searchParams }: { searchParams: { pay?: string; placed?: string; directPay?: string } }) {
  const { profile } = await requireStudent();
  const orders = await prisma.order.findMany({
    where: { buyerId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      items: true,
      business: { select: { name: true, slug: true, mpesaMethod: true, mpesaNumber: true, mpesaAccount: true } },
      review: { select: { id: true } },
      dispute: { select: { status: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, failReason: true } },
    },
  });
  const devSimulation = process.env.NODE_ENV !== "production" && (process.env.PAYMENT_PROVIDER ?? "mock") === "mock";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div><h1 className="font-display text-2xl font-bold">My orders</h1></div>

      {searchParams.placed && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" /><span>Order <strong>{searchParams.placed}</strong> placed! The seller will confirm it shortly. You pay them directly when you receive it.</span>
        </div>
      )}

      {orders.length === 0 && <div className="stat-card text-center py-12 text-sm text-muted-foreground">No orders yet. <Link href="/buyer/discover" className="text-primary hover:underline">Find something to buy →</Link></div>}

      {orders.map((o) => (
        <div key={o.id} className="stat-card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold"><Link href={`/${o.business.slug}`} className="hover:underline">{o.business.name}</Link></p>
              <p className="text-xs text-muted-foreground font-mono">{o.orderNumber} · {timeAgo(o.createdAt)}</p>
            </div>
            <OrderStatusBadge status={o.status} />
          </div>
          <ul className="text-sm space-y-0.5">{o.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.quantity} × {i.nameSnapshot}</span><span>{formatKes(i.lineTotal)}</span></li>)}</ul>
          <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
            <span>Total {o.paymentMode === "ESCROW" ? "· 🔒 escrow" : o.paymentMode === "DIRECT_TRANSFER" ? "· direct M-Pesa" : "· pay on delivery"}</span><span>{formatKes(o.total)}</span>
          </div>
          {o.status === "CANCELLED" && o.cancelReason && <p className="text-xs text-muted-foreground">Reason: {o.cancelReason}</p>}
          {o.escrowStatus === "REFUNDED" && <p className="text-xs text-green-700">Your money is being refunded to your M-Pesa.</p>}
          {o.dispute && o.status === "DISPUTED" && <p className="text-xs text-red-700">An admin is reviewing your problem report and will decide within 48 hours.</p>}

          <BuyerOrderActions
            orderId={o.id} status={o.status} paymentMode={o.paymentMode} hasReview={!!o.review}
            autoOpenPay={searchParams.pay === o.id} devSimulation={devSimulation}
            lastPayment={o.payments[0] ?? null} autoReleaseAt={o.autoReleaseAt?.toISOString() ?? null}
            business={o.business} buyerMarkedPaidAt={!!o.buyerMarkedPaidAt} sellerConfirmedPaidAt={!!o.sellerConfirmedPaidAt}
          />
        </div>
      ))}
    </div>
  );
}
