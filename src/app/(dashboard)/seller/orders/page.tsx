// /seller/orders — orders for my business, newest first.

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { formatKes } from "@/lib/money";
import { timeAgo } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { SellerOrderActions } from "./SellerOrderActions";

export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  const { profile } = await requireStudent();
  if (!profile.business) return <p className="text-sm text-muted-foreground max-w-xl mx-auto">Set up your storefront to start receiving orders.</p>;

  const orders = await prisma.order.findMany({
    // Unpaid escrow orders aren't real orders yet — the seller shouldn't see (or start work on) them.
    where: { businessId: profile.business.id, status: { not: "PENDING_PAYMENT" } },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { items: true, buyer: { include: { user: { select: { phone: true } } } } },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div><h1 className="font-display text-2xl font-bold">Orders</h1><p className="text-sm text-muted-foreground">Confirm, prepare and hand over. Paid orders are released to your M-Pesa once the buyer confirms.</p></div>

      {orders.length === 0 && <div className="stat-card text-center py-12 text-sm text-muted-foreground">No orders yet. Share your storefront link to get your first one!</div>}

      {orders.map((o) => (
        <div key={o.id} className="stat-card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(o.createdAt)} · {o.buyer.fullName} · <a className="text-primary" href={`tel:+${o.buyer.user.phone}`}>0{o.buyer.user.phone.slice(3)}</a></p>
            </div>
            <OrderStatusBadge status={o.status} />
          </div>

          <ul className="text-sm space-y-0.5">{o.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.quantity} × {i.nameSnapshot}</span><span>{formatKes(i.lineTotal)}</span></li>)}</ul>

          <div className="text-xs text-muted-foreground space-y-0.5 border-t border-border pt-2">
            <p>{o.deliveryMethod === "DELIVERY" ? `Deliver to: ${o.deliveryAddress}` : "Customer will pick up"}</p>
            {o.buyerNote && <p>Note: “{o.buyerNote}”</p>}
            <p>
              {o.paymentMode === "ESCROW" && <>🔒 Paid via escrow · you receive <strong className="text-foreground">{formatKes(o.sellerPayout)}</strong> (after {formatKes(o.platformFee)} fee)</>}
              {o.paymentMode === "ON_DELIVERY" && <>💵 Pay on delivery · collect <strong className="text-foreground">{formatKes(o.total)}</strong> from the buyer yourself</>}
              {o.paymentMode === "DIRECT_TRANSFER" && <>📱 Direct M-Pesa · buyer sends <strong className="text-foreground">{formatKes(o.total)}</strong> straight to you — check your own M-Pesa before accepting</>}
            </p>
          </div>

          <SellerOrderActions
            orderId={o.id} status={o.status} paymentMode={o.paymentMode}
            buyerMarkedPaidAt={!!o.buyerMarkedPaidAt} sellerConfirmedPaidAt={!!o.sellerConfirmedPaidAt}
            buyerPaymentRef={o.buyerPaymentRef} hasProof={!!o.buyerPaymentProofKey}
          />
        </div>
      ))}
    </div>
  );
}
