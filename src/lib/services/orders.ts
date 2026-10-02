// src/lib/services/orders.ts
// Order placement, escrow and payouts. This is the only module that moves money state.
//
// Invariants (each is enforced in code, not by convention):
//  1. Prices/totals are computed HERE from the database. The client never supplies them.
//  2. Stock is decremented with a conditional UPDATE, so two buyers can't both take the last item.
//  3. Every status change is a compare-and-set on the previous status: a double-click or a
//     concurrent cron run cannot apply the same transition twice.
//  4. A seller is paid at most once per order: Payout has a unique (orderId, kind) index.
//  5. Money that arrives for an order that no longer wants it is refunded, not kept.
//  6. Failed payouts are NOT auto-retried (a timeout may hide a payout that actually went through);
//     they surface to an admin who checks the provider dashboard first.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { PLATFORM } from "@/lib/constants/platform";
import { allowedPaymentModes, calculateAmounts, generateOrderNumber } from "@/lib/money";
import { nextStatus, type OrderAction } from "@/lib/order-state";
import { getPaymentProvider, isEscrowAvailable } from "@/lib/payments";
import type { z } from "zod";
import type { placeOrderSchema } from "@/lib/validations";

type Tx = Prisma.TransactionClient;
export type PlaceOrderInput = z.output<typeof placeOrderSchema>;
export type ActorRef = { kind: "BUYER" | "SELLER"; profileId: string } | { kind: "SYSTEM" };

const ORDER_INCLUDE = {
  business: { include: { owner: { include: { user: true } } } },
  buyer: { include: { user: true } },
  items: true,
  payments: true,
} satisfies Prisma.OrderInclude;
type OrderFull = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

const minutes = (n: number) => new Date(Date.now() + n * 60_000);
const hours = (n: number) => new Date(Date.now() + n * 3_600_000);

// Prisma's default interactive-transaction timeout is 5000ms. Verified against the real
// Supabase pooler this app deploys to: a placeOrder transaction (a handful of sequential
// round-trips — stock update, order insert, item insert) took 5.2-5.7s and got rolled back
// mid-way with "Transaction already closed", which would make real checkouts fail at random.
// Generous headroom here; the actual fix is keeping transactions short (see the notify() note
// below), this is the safety margin on top of that.
const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

async function notify(tx: Tx | typeof prisma, userId: string, n: { type: string; title: string; body: string; link?: string }) {
  await tx.notification.create({ data: { userId, ...n } });
}

/** Fire a notification after a money-moving transaction has already committed. Never let a
 *  notification failure (or the extra round-trip) threaten — or be blamed on — the transaction
 *  that actually matters. Errors are logged, not thrown: the caller's real work is already done. */
async function notifyAfter(userId: string, n: { type: string; title: string; body: string; link?: string }) {
  await notify(prisma, userId, n).catch((e) => console.error("[notify] failed (non-fatal)", e));
}

// ─── PLACING AN ORDER ───────────────────────────────────────────

export async function placeOrder(buyer: { profileId: string; userId: string; fullName: string; email: string }, input: PlaceOrderInput) {
  const business = await prisma.business.findFirst({
    where: { id: input.businessId, isActive: true },
    include: { owner: { include: { user: { select: { id: true, status: true } } } } },
  });
  if (!business || business.owner.user.status !== "ACTIVE") throw new ApiError(404, "This business isn't available.");
  if (business.ownerId === buyer.profileId) throw new ApiError(400, "You can't order from your own business.");
  if (!business.isOpen) throw new ApiError(409, `${business.name} isn't taking orders right now.`);
  if (input.deliveryMethod === "DELIVERY" && !business.acceptsDelivery) {
    throw new ApiError(400, `${business.name} doesn't deliver. Choose pickup.`);
  }
  if (input.paymentMode === "DIRECT_TRANSFER" && !business.mpesaMethod) {
    throw new ApiError(400, `${business.name} hasn't set up M-Pesa payments yet.`);
  }

  // Merge duplicate lines so one product can't be listed twice to dodge a stock check.
  const wanted = new Map<string, number>();
  for (const it of input.items) wanted.set(it.productId, (wanted.get(it.productId) ?? 0) + it.quantity);

  const products = await prisma.product.findMany({
    where: { id: { in: [...wanted.keys()] }, businessId: business.id, isActive: true },
  });
  if (products.length !== wanted.size) throw new ApiError(400, "One of those items is no longer available. Refresh and try again.");

  const lines = products.map((p) => {
    const quantity = wanted.get(p.id)!;
    return { product: p, quantity, lineTotal: p.price * quantity };
  });
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const hasService = lines.some((l) => l.product.type === "SERVICE");

  const rule = allowedPaymentModes(subtotal, hasService, isEscrowAvailable());
  if (!rule.allowed.includes(input.paymentMode)) throw new ApiError(400, rule.reason);
  const amounts = calculateAmounts(subtotal, input.paymentMode);
  const isEscrow = input.paymentMode === "ESCROW"; // the only mode with a payment-pending gate / STK push

  let order: OrderFull | null = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    try {
      order = await prisma.$transaction(async (tx) => {
        for (const l of lines) {
          if (l.product.stock === null) continue; // unlimited (services)
          const res = await tx.product.updateMany({
            where: { id: l.product.id, stock: { gte: l.quantity } },
            data: { stock: { decrement: l.quantity } },
          });
          if (res.count !== 1) {
            const fresh = await tx.product.findUnique({ where: { id: l.product.id }, select: { stock: true } });
            throw new ApiError(409, `Only ${fresh?.stock ?? 0} of "${l.product.name}" left.`);
          }
        }

        const created = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            buyerId: buyer.profileId,
            businessId: business.id,
            paymentMode: input.paymentMode,
            status: isEscrow ? "PENDING_PAYMENT" : "PLACED",
            escrowStatus: isEscrow ? "AWAITING_PAYMENT" : "NONE",
            ...amounts,
            deliveryMethod: input.deliveryMethod,
            deliveryAddress: input.deliveryMethod === "DELIVERY" ? input.deliveryAddress : null,
            buyerNote: input.buyerNote || null,
            buyerPhone: input.phone,
            placedAt: isEscrow ? null : new Date(),
            expiresAt: isEscrow ? minutes(PLATFORM.escrow.pendingPaymentMinutes) : null,
            items: {
              create: lines.map((l) => ({
                productId: l.product.id,
                nameSnapshot: l.product.name,
                unitPrice: l.product.price,
                quantity: l.quantity,
                lineTotal: l.lineTotal,
              })),
            },
          },
          include: ORDER_INCLUDE,
        });
        return created;
      }, TX_OPTIONS);
    } catch (e) {
      const collision = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!collision) throw e; // only an order-number collision is worth retrying
    }
  }
  if (!order) throw new ApiError(500, "Couldn't create the order. Please try again.");

  if (!isEscrow) {
    // Notified after commit, not inside the transaction above — see notifyAfter().
    const body =
      input.paymentMode === "DIRECT_TRANSFER"
        ? `${buyer.fullName} placed ${order.orderNumber} (KES ${order.total.toLocaleString()}). Check your M-Pesa for their payment, then confirm receipt in Orders before accepting.`
        : `${buyer.fullName} ordered ${order.orderNumber} (KES ${order.total.toLocaleString()}) — pay on delivery.`;
    await notifyAfter(business.owner.userId, { type: "ORDER", title: "New order!", body, link: "/seller/orders" });
    return { order, payment: null as null | { ok: boolean; error?: string } };
  }
  const payment = await initiatePayment(order.id);
  return { order, payment };
}

// ─── PAYMENT (money in) ─────────────────────────────────────────

/** Send (or re-send) the M-Pesa prompt for an unpaid escrow order. */
export async function initiatePayment(orderId: string): Promise<{ ok: boolean; error?: string; alreadyPrompting?: boolean }> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { buyer: { include: { user: true } }, payments: true } });
  if (!order || order.paymentMode !== "ESCROW") throw new ApiError(404, "Order not found.");
  if (order.status !== "PENDING_PAYMENT") throw new ApiError(409, "This order isn't waiting for payment.");
  if (order.payments.some((p) => p.status === "SUCCEEDED")) throw new ApiError(409, "This order is already paid.");

  const recent = order.payments.find((p) => p.status === "PENDING" && Date.now() - p.createdAt.getTime() < 90_000);
  if (recent) return { ok: true, alreadyPrompting: true };

  const provider = getPaymentProvider();
  let payment;
  try {
    payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        apiRef: `${order.orderNumber}-${order.payments.length + 1}`,
        amount: order.total,
        phone: order.buyerPhone,
      },
    });
  } catch (e) {
    // Two "resend" clicks (or two tabs) raced past the `recent` check above before either had
    // committed, and both computed the same apiRef from the same payments.length snapshot.
    // The unique apiRef constraint caught it — tell the caller we're already on it rather than
    // surfacing a raw 500 for what is actually a harmless double-click.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: true, alreadyPrompting: true };
    throw e;
  }
  await prisma.order.update({ where: { id: order.id }, data: { expiresAt: minutes(PLATFORM.escrow.pendingPaymentMinutes) } });

  const [firstName, ...rest] = order.buyer.fullName.split(" ");
  try {
    const { providerRef } = await provider.requestPayment({
      apiRef: payment.apiRef,
      amount: payment.amount,
      phone: payment.phone,
      narrative: `Comrade Market ${order.orderNumber}`,
      buyer: { firstName, lastName: rest.join(" ") || firstName, email: order.buyer.user.email },
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef } });
    return { ok: true };
  } catch (e) {
    console.error("[payments] requestPayment failed", e);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failReason: e instanceof Error ? e.message.slice(0, 200) : "Request failed" } });
    return { ok: false, error: "We couldn't send the M-Pesa prompt. Check your number and try again." };
  }
}

/**
 * Record the provider's verdict on a payment. Idempotent: only the first call for a payment does anything.
 * ALWAYS call this with a result obtained from provider.getPaymentStatus(), never from a webhook body.
 */
export async function settlePayment(paymentId: string, result: "SUCCEEDED" | "FAILED", failReason?: string) {
  // The transaction returns what happened rather than mutating an outer variable from inside
  // the closure — same outcome, but doesn't depend on TS's (inconsistent) narrowing of a `let`
  // reassigned inside a callback.
  const outcome = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: { status: result, paidAt: result === "SUCCEEDED" ? new Date() : null, failReason: result === "FAILED" ? failReason ?? "Payment failed" : null },
    });
    if (claimed.count !== 1 || result === "FAILED") return null; // already settled, or failed (order stays open for a retry)

    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId }, include: ORDER_INCLUDE });

    if (order.status === "PENDING_PAYMENT") {
      await tx.order.update({ where: { id: order.id }, data: { status: "PLACED", escrowStatus: "HELD", placedAt: new Date(), expiresAt: null } });
      return {
        refundPayoutId: null,
        paidNotify: {
          userId: order.business.owner.userId,
          body: `${order.buyer.fullName} paid KES ${order.total.toLocaleString()} for ${order.orderNumber}. The money is held safely until they receive it.`,
        },
      };
    }
    if (order.status === "CANCELLED" && order.escrowStatus !== "REFUNDED") {
      // (5) Paid after the order was cancelled / expired: give it straight back.
      const refundPayoutId = await queueRefund(tx, order, payment.phone);
      await tx.order.update({ where: { id: order.id }, data: { escrowStatus: "REFUNDED" } });
      return { refundPayoutId, paidNotify: null };
    }
    // Paid twice, or paid on an order that has moved on. Don't guess with money: flag it for a human.
    await tx.auditLog.create({
      data: { action: "UNEXPECTED_PAYMENT", entityType: "Payment", entityId: payment.id, metadata: { orderId: order.id, orderStatus: order.status, amount: payment.amount } },
    });
    return null;
  }, TX_OPTIONS);

  if (outcome?.paidNotify) await notifyAfter(outcome.paidNotify.userId, { type: "ORDER", title: "New paid order!", body: outcome.paidNotify.body, link: "/seller/orders" });
  if (outcome?.refundPayoutId) await processPayout(outcome.refundPayoutId).catch((e) => console.error("[payout]", e));
}

// ─── PAYOUTS (money out) ────────────────────────────────────────

async function queueSellerPayout(tx: Tx, order: OrderFull): Promise<string> {
  const p = await tx.payout.create({
    data: {
      orderId: order.id,
      kind: "SELLER_PAYOUT",
      phone: order.business.owner.user.phone,
      recipient: order.business.name.slice(0, 40),
      amount: order.sellerPayout,
    },
  });
  await tx.auditLog.create({ data: { action: "PAYOUT_QUEUED", entityType: "Order", entityId: order.id, metadata: { kind: p.kind, amount: p.amount, fee: order.platformFee } } });
  return p.id;
}

async function queueRefund(tx: Tx, order: OrderFull, payerPhone?: string): Promise<string | null> {
  const existing = await tx.payout.findUnique({ where: { orderId_kind: { orderId: order.id, kind: "BUYER_REFUND" } } });
  if (existing) return null;
  const phone = payerPhone ?? order.payments.find((pay) => pay.status === "SUCCEEDED")?.phone ?? order.buyerPhone;
  try {
    const p = await tx.payout.create({
      data: { orderId: order.id, kind: "BUYER_REFUND", phone, recipient: order.buyer.fullName.slice(0, 40), amount: order.total },
    });
    await tx.auditLog.create({ data: { action: "REFUND_QUEUED", entityType: "Order", entityId: order.id, metadata: { amount: p.amount } } });
    return p.id;
  } catch (e) {
    // Lost a race with another caller queueing the same refund (e.g. a late webhook landing
    // the same moment a cron run cancels the order) — the unique (orderId, kind) index caught
    // it, which is exactly what it's for. Treat it the same as "already queued".
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null;
    throw e;
  }
}

/** Send one queued payout. Safe to call repeatedly: only a PENDING payout is ever claimed (6). */
export async function processPayout(payoutId: string) {
  const claimed = await prisma.payout.updateMany({
    where: { id: payoutId, status: "PENDING" },
    data: { status: "PROCESSING", attempts: { increment: 1 }, lastError: null },
  });
  if (claimed.count !== 1) return;

  const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId }, include: { order: { include: { business: { include: { owner: true } }, buyer: true } } } });
  try {
    const res = await getPaymentProvider().sendPayout({
      apiRef: `payout-${payout.id}`,
      amount: payout.amount,
      phone: payout.phone,
      recipient: payout.recipient,
      narrative: `Comrade Market ${payout.order.orderNumber}`,
    });
    await prisma.payout.update({
      where: { id: payout.id },
      data: { providerRef: res.providerRef, status: res.state, completedAt: res.state === "SUCCEEDED" ? new Date() : null },
    });
    if (res.state === "SUCCEEDED") await notifyPayoutDone(payout);
  } catch (e) {
    console.error("[payout] failed", payout.id, e);
    // Deliberately left FAILED, not retried automatically — see invariant (6).
    await prisma.payout.update({ where: { id: payout.id }, data: { status: "FAILED", lastError: e instanceof Error ? e.message.slice(0, 300) : "Unknown error" } });
  }
}

async function notifyPayoutDone(payout: { kind: string; amount: number; order: { orderNumber: string; business: { owner: { userId: string } }; buyer: { userId: string } } }) {
  const seller = payout.kind === "SELLER_PAYOUT";
  await notify(prisma, seller ? payout.order.business.owner.userId : payout.order.buyer.userId, {
    type: "PAYMENT",
    title: seller ? "You've been paid!" : "Refund sent",
    body: seller
      ? `KES ${payout.amount.toLocaleString()} for ${payout.order.orderNumber} has been sent to your M-Pesa.`
      : `KES ${payout.amount.toLocaleString()} for ${payout.order.orderNumber} has been refunded to your M-Pesa.`,
    link: seller ? "/seller/orders" : "/buyer/orders",
  });
}

/** Admin action: put a FAILED payout back in the queue, after checking the provider dashboard that it truly didn't send. */
export async function requeueFailedPayout(payoutId: string, adminId: string) {
  const res = await prisma.payout.updateMany({ where: { id: payoutId, status: "FAILED" }, data: { status: "PENDING" } });
  if (res.count !== 1) throw new ApiError(409, "Only failed payouts can be retried.");
  await prisma.auditLog.create({ data: { actorId: adminId, action: "PAYOUT_REQUEUED", entityType: "Payout", entityId: payoutId } });
  await processPayout(payoutId);
}

// ─── TRANSITIONS ────────────────────────────────────────────────

export async function applyOrderAction(
  orderId: string,
  actor: ActorRef,
  action: OrderAction,
  extra: { reason?: string; description?: string } = {},
) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  // 404 (not 403) so nobody can probe which order ids exist.
  if (!order) throw new ApiError(404, "Order not found.");
  if (actor.kind === "BUYER" && order.buyerId !== actor.profileId) throw new ApiError(404, "Order not found.");
  if (actor.kind === "SELLER" && order.business.ownerId !== actor.profileId) throw new ApiError(404, "Order not found.");

  const t = nextStatus(order.status, action, actor.kind);
  if (!t.ok) throw new ApiError(409, t.reason);
  if (action === "DISPUTE" && (!extra.reason || !extra.description)) throw new ApiError(400, "Tell us what went wrong so we can help.");
  // DIRECT_TRANSFER has no automatic payment check — this is the one place that stands in for
  // it: a seller can't accept the order until THEY say they've seen the money in their own
  // M-Pesa (see confirmPaymentReceived). Doesn't apply to ESCROW (provider already confirmed
  // payment before the order could reach PLACED) or ON_DELIVERY (nothing to confirm yet).
  if (action === "CONFIRM" && order.paymentMode === "DIRECT_TRANSFER" && !order.sellerConfirmedPaidAt) {
    throw new ApiError(409, "Confirm you've received the payment before accepting this order.");
  }

  const now = new Date();
  const payoutIds: string[] = [];
  const sellerUser = order.business.owner.userId;
  const buyerUser = order.buyer.userId;
  const held = order.paymentMode === "ESCROW" && order.escrowStatus === "HELD";

  await prisma.$transaction(async (tx) => {
    const data: Prisma.OrderUpdateManyMutationInput = { status: t.to };

    switch (action) {
      case "CONFIRM":
        data.confirmedAt = now;
        break;
      case "MARK_READY":
        data.readyAt = now;
        break;
      case "MARK_DELIVERED":
        data.deliveredAt = now;
        data.autoReleaseAt = hours(PLATFORM.escrow.autoReleaseHours);
        break;
      case "RECEIVE":
        data.completedAt = now;
        data.autoReleaseAt = null;
        if (held) {
          data.escrowStatus = "RELEASED";
          payoutIds.push(await queueSellerPayout(tx, order));
        }
        break;
      case "CANCEL":
        data.cancelledAt = now;
        data.cancelReason = extra.reason ?? null;
        data.autoReleaseAt = null;
        for (const item of order.items) {
          await tx.product.updateMany({ where: { id: item.productId, stock: { not: null } }, data: { stock: { increment: item.quantity } } });
        }
        if (held) {
          data.escrowStatus = "REFUNDED";
          const id = await queueRefund(tx, order);
          if (id) payoutIds.push(id);
        } else if (order.escrowStatus === "AWAITING_PAYMENT") {
          data.escrowStatus = "NONE";
        }
        break;
      case "DISPUTE":
        data.autoReleaseAt = null; // a disputed order must never auto-release
        await tx.dispute.create({
          data: { orderId: order.id, raisedById: (actor as { profileId: string }).profileId, reason: extra.reason!, description: extra.description! },
        });
        break;
    }

    // Compare-and-set (3): fails if anything else moved the order since we read it.
    const claimed = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data });
    if (claimed.count !== 1) throw new ApiError(409, "This order just changed. Refresh and try again.");

    // Audit trail is part of the atomic change (compliance/dispute evidence); user-facing
    // notifications are not — they're sent after commit, see below.
    if (action === "RECEIVE" || action === "CANCEL" || action === "DISPUTE") {
      await tx.auditLog.create({ data: { action: `ORDER_${action}`, entityType: "Order", entityId: order.id, metadata: { by: actor.kind, from: order.status, to: t.to } } });
    }
  }, TX_OPTIONS);

  await notifyTransition(action, actor.kind, order, { sellerUser, buyerUser });
  if (action === "DISPUTE") {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const a of admins) {
      await notifyAfter(a.id, { type: "DISPUTE", title: "New dispute", body: `Order ${order.orderNumber}: ${extra.reason}`, link: "/admin/disputes" });
    }
  }

  for (const id of payoutIds) await processPayout(id).catch((e) => console.error("[payout]", e));
  return prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: ORDER_INCLUDE });
}

async function notifyTransition(
  action: OrderAction,
  by: ActorRef["kind"],
  order: OrderFull,
  users: { sellerUser: string; buyerUser: string },
) {
  const n = order.orderNumber;
  const toBuyer = (title: string, body: string) => notifyAfter(users.buyerUser, { type: "ORDER", title, body, link: "/buyer/orders" });
  const toSeller = (title: string, body: string) => notifyAfter(users.sellerUser, { type: "ORDER", title, body, link: "/seller/orders" });

  switch (action) {
    case "CONFIRM": return toBuyer("Order confirmed", `${order.business.name} confirmed ${n}.`);
    case "MARK_READY": return toBuyer("Order ready", `${n} from ${order.business.name} is ready / on its way.`);
    case "MARK_DELIVERED": return toBuyer("Did you get it?", `${order.business.name} says ${n} was delivered. Please confirm receipt (or raise a problem) within ${PLATFORM.escrow.autoReleaseHours} hours.`);
    case "RECEIVE": return toSeller(by === "SYSTEM" ? "Order auto-completed" : "Order completed", `${n} is complete.${order.paymentMode === "ESCROW" ? " Your payment is being sent to M-Pesa." : ""}`);
    case "CANCEL": return by === "BUYER" ? toSeller("Order cancelled", `${n} was cancelled by the buyer.`) : toBuyer("Order cancelled", `${n} was cancelled.${order.escrowStatus === "HELD" ? " Your money is being refunded." : ""}`);
    case "DISPUTE": return toSeller("Buyer raised a problem", `${n} is now in dispute. An admin will review it.`);
  }
}

// ─── DIRECT_TRANSFER PAYMENT HANDSHAKE ───────────────────────────
// No provider is involved here — this is a confirmation trail between buyer and seller, not a
// money-safety guarantee. If either side lies, the only recourse is the admin dispute system
// (reputational/mediated, not a forced refund — the platform never held this money).

/** Buyer: "I've sent the money." Optional evidence (an M-Pesa reference code and/or a screenshot). */
export async function markBuyerPaid(orderId: string, buyerProfileId: string, info: { reference?: string | null; proofKey?: string | null }) {
  const res = await prisma.order.updateMany({
    where: { id: orderId, buyerId: buyerProfileId, paymentMode: "DIRECT_TRANSFER", status: "PLACED", buyerMarkedPaidAt: null },
    data: { buyerMarkedPaidAt: new Date(), buyerPaymentRef: info.reference || null, buyerPaymentProofKey: info.proofKey || null },
  });
  if (res.count !== 1) throw new ApiError(409, "This order isn't waiting for a payment confirmation.");

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  await notifyAfter(order.business.owner.userId, {
    type: "ORDER",
    title: "Buyer says they've paid",
    body: `${order.buyer.fullName} says they sent KES ${order.total.toLocaleString()} for ${order.orderNumber}${info.reference ? ` (ref: ${info.reference})` : ""}. Check your M-Pesa, then confirm in Orders.`,
    link: "/seller/orders",
  });
}

/** Seller: "I checked my M-Pesa — it's there." Unlocks CONFIRM (see the guard in applyOrderAction). */
export async function confirmPaymentReceived(orderId: string, sellerProfileId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, business: { ownerId: sellerProfileId } }, include: ORDER_INCLUDE });
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.paymentMode !== "DIRECT_TRANSFER") throw new ApiError(409, "This order isn't paid by direct transfer.");

  const res = await prisma.order.updateMany({ where: { id: orderId, sellerConfirmedPaidAt: null }, data: { sellerConfirmedPaidAt: new Date() } });
  if (res.count !== 1) throw new ApiError(409, "Already confirmed.");

  await notifyAfter(order.buyer.userId, {
    type: "ORDER",
    title: "Payment confirmed",
    body: `${order.business.name} confirmed they received your payment for ${order.orderNumber}.`,
    link: "/buyer/orders",
  });
}

// ─── DISPUTES ───────────────────────────────────────────────────

export async function resolveDispute(disputeId: string, adminId: string, outcome: "BUYER" | "SELLER", note: string) {
  const payoutIds: string[] = [];

  const notifyUsers = await prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUnique({ where: { id: disputeId }, include: { order: { include: ORDER_INCLUDE } } });
    if (!dispute) throw new ApiError(404, "Dispute not found.");
    const order = dispute.order;

    const claimed = await tx.dispute.updateMany({
      where: { id: disputeId, status: "OPEN" },
      data: { status: outcome === "BUYER" ? "RESOLVED_BUYER" : "RESOLVED_SELLER", resolution: note, resolvedById: adminId, resolvedAt: new Date() },
    });
    if (claimed.count !== 1) throw new ApiError(409, "This dispute has already been resolved.");

    const held = order.paymentMode === "ESCROW" && order.escrowStatus === "HELD";
    const data: Prisma.OrderUpdateManyMutationInput =
      outcome === "BUYER"
        ? { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Dispute resolved in the buyer's favour" }
        : { status: "COMPLETED", completedAt: new Date() };

    if (outcome === "BUYER") {
      // BUG FIX: a buyer-won dispute means the buyer didn't get the goods — exactly like a
      // CANCEL, the seller's stock must come back. This was missing: applyOrderAction's CANCEL
      // restocks, but this path (the other way an order ends without the buyer keeping the
      // goods) didn't, so a seller's stock count silently drifted low after every dispute they
      // lost. Runs regardless of payment mode, same as CANCEL — this is about inventory, not escrow.
      for (const item of order.items) {
        await tx.product.updateMany({ where: { id: item.productId, stock: { not: null } }, data: { stock: { increment: item.quantity } } });
      }
    }

    if (held) {
      if (outcome === "BUYER") {
        data.escrowStatus = "REFUNDED";
        const id = await queueRefund(tx, order);
        if (id) payoutIds.push(id);
      } else {
        data.escrowStatus = "RELEASED";
        payoutIds.push(await queueSellerPayout(tx, order));
      }
    }

    const moved = await tx.order.updateMany({ where: { id: order.id, status: "DISPUTED" }, data });
    if (moved.count !== 1) throw new ApiError(409, "Order is no longer in dispute.");

    await tx.auditLog.create({ data: { actorId: adminId, action: "DISPUTE_RESOLVED", entityType: "Dispute", entityId: disputeId, metadata: { outcome, note, orderId: order.id } } });
    return { buyerUser: order.buyer.userId, sellerUser: order.business.owner.userId, orderNumber: order.orderNumber };
  }, TX_OPTIONS);

  if (notifyUsers) {
    const msg = `Dispute on ${notifyUsers.orderNumber} resolved in favour of the ${outcome === "BUYER" ? "buyer" : "seller"}: ${note}`;
    await notifyAfter(notifyUsers.buyerUser, { type: "DISPUTE", title: "Dispute resolved", body: msg, link: "/buyer/orders" });
    await notifyAfter(notifyUsers.sellerUser, { type: "DISPUTE", title: "Dispute resolved", body: msg, link: "/seller/orders" });
  }
  for (const id of payoutIds) await processPayout(id).catch((e) => console.error("[payout]", e));
}

// ─── REVIEWS ────────────────────────────────────────────────────

export async function submitReview(buyerProfileId: string, orderId: string, input: { rating: number; comment?: string | null }) {
  const order = await prisma.order.findFirst({ where: { id: orderId, buyerId: buyerProfileId }, include: { review: true } });
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.status !== "COMPLETED") throw new ApiError(409, "You can review an order once it's completed.");
  if (order.review) throw new ApiError(409, "You've already reviewed this order.");
  try {
    await prisma.review.create({
      data: { orderId, businessId: order.businessId, reviewerId: buyerProfileId, rating: input.rating, comment: input.comment || null },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new ApiError(409, "You've already reviewed this order.");
    throw e;
  }
}

// ─── SCHEDULED MAINTENANCE (called by /api/cron/maintenance) ────

export async function runMaintenance() {
  const provider = getPaymentProvider();
  const summary = { paymentsSettled: 0, payoutsReconciled: 0, expired: 0, autoReleased: 0, errors: 0 };
  const guard = async (fn: () => Promise<void>) => { try { await fn(); } catch (e) { summary.errors++; console.error("[maintenance]", e); } };

  // 1. Ask the provider about payments whose webhook never arrived. Must run BEFORE expiry,
  //    otherwise we could expire an order the buyer has in fact paid for.
  const pendingPayments = await prisma.payment.findMany({
    where: { status: "PENDING", providerRef: { not: null }, createdAt: { lt: new Date(Date.now() - 30_000) } },
    take: 100,
  });
  for (const p of pendingPayments) {
    await guard(async () => {
      const s = await provider.getPaymentStatus(p.providerRef!);
      if (s.state !== "PENDING") { await settlePayment(p.id, s.state, s.failReason); summary.paymentsSettled++; }
    });
  }

  // 2. Payouts the provider is still processing.
  const processing = await prisma.payout.findMany({ where: { status: "PROCESSING", providerRef: { not: null } }, include: { order: { include: { business: { include: { owner: true } }, buyer: true } } }, take: 100 });
  for (const p of processing) {
    await guard(async () => {
      const s = await provider.getPayoutStatus(p.providerRef!);
      if (s.state === "PROCESSING") return;
      await prisma.payout.update({ where: { id: p.id }, data: { status: s.state, lastError: s.failReason ?? null, completedAt: s.state === "SUCCEEDED" ? new Date() : null } });
      if (s.state === "SUCCEEDED") await notifyPayoutDone(p);
      summary.payoutsReconciled++;
    });
  }

  // 3. Expire unpaid orders (returns their stock).
  const stale = await prisma.order.findMany({ where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } }, select: { id: true }, take: 100 });
  for (const o of stale) await guard(async () => { await applyOrderAction(o.id, { kind: "SYSTEM" }, "CANCEL", { reason: "Payment not received in time" }); summary.expired++; });

  // 4. Auto-release: the buyer stayed silent for the whole window after the seller marked it delivered.
  const due = await prisma.order.findMany({ where: { status: "DELIVERED", autoReleaseAt: { lt: new Date() } }, select: { id: true }, take: 100 });
  for (const o of due) await guard(async () => { await applyOrderAction(o.id, { kind: "SYSTEM" }, "RECEIVE"); summary.autoReleased++; });

  return summary;
}

// ─── POLLING (buyer's browser + local dev) ──────────────────────

/** Ask the provider about this order's open payment and settle it. Lets the UI confirm payment without waiting for a webhook. */
export async function syncOrderPayment(orderId: string) {
  const pending = await prisma.payment.findMany({ where: { orderId, status: "PENDING", providerRef: { not: null } } });
  const provider = getPaymentProvider();
  for (const p of pending) {
    const s = await provider.getPaymentStatus(p.providerRef!);
    if (s.state !== "PENDING") await settlePayment(p.id, s.state, s.failReason);
  }
}
