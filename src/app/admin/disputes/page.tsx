// /admin/disputes — you decide who gets the money.

import { prisma } from "@/lib/prisma";
import { formatKes } from "@/lib/money";
import { timeAgo } from "@/lib/utils";
import { ResolveDispute } from "./ResolveDispute";

export const dynamic = "force-dynamic";

export default async function DisputesPage() {
  const disputes = await prisma.dispute.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    include: {
      raisedBy: { include: { user: { select: { phone: true } } } },
      order: { include: { items: true, business: { include: { owner: { include: { user: { select: { phone: true } } } } } } } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div><h1 className="font-display text-2xl font-bold">Disputes</h1><p className="text-sm text-muted-foreground">Contact both sides (phone numbers below), read the evidence, then decide. Resolving in the buyer&apos;s favour refunds them; in the seller&apos;s favour pays the seller.</p></div>
      {disputes.length === 0 && <div className="stat-card text-center py-12 text-sm text-muted-foreground">No open disputes.</div>}
      {disputes.map((d) => {
        const o = d.order;
        const sellerPhone = o.business.owner.user.phone;
        return (
          <div key={d.id} className="stat-card space-y-3 text-sm">
            <div className="flex justify-between gap-2"><span className="font-mono font-semibold">{o.orderNumber}</span><span className="text-xs text-muted-foreground">raised {timeAgo(d.createdAt)}</span></div>
            <ul className="space-y-0.5">{o.items.map((i) => <li key={i.id}>{i.quantity} × {i.nameSnapshot} — {formatKes(i.lineTotal)}</li>)}</ul>
            <p><strong>{formatKes(o.total)}</strong> · {o.paymentMode === "ESCROW" ? `🔒 held in escrow (seller would get ${formatKes(o.sellerPayout)})` : "pay on delivery — no money held, this only affects reputation"}</p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/50 rounded-lg p-3"><p className="font-semibold text-sm">Buyer: {d.raisedBy.fullName}</p><a className="text-primary" href={`tel:+${d.raisedBy.user.phone}`}>+{d.raisedBy.user.phone}</a></div>
              <div className="bg-muted/50 rounded-lg p-3"><p className="font-semibold text-sm">Seller: {o.business.name}</p><a className="text-primary" href={`tel:+${sellerPhone}`}>+{sellerPhone}</a></div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="font-semibold text-red-900">{d.reason}</p><p className="text-red-900/90 mt-1 whitespace-pre-line">{d.description}</p></div>
            <ResolveDispute disputeId={d.id} />
          </div>
        );
      })}
    </div>
  );
}
