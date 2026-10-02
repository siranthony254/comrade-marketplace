// src/lib/order-state.ts
// The order state machine. Pure functions, no database: every status change in
// the app must be approved by nextStatus() so the rules live in exactly one place.
//
//  ESCROW:       PENDING_PAYMENT -> PLACED -> CONFIRMED -> READY -> DELIVERED -> COMPLETED
//  ON_DELIVERY:                     PLACED -> CONFIRMED -> READY -> DELIVERED -> COMPLETED
//  any time before COMPLETED the buyer may raise a DISPUTE (from READY/DELIVERED)
//  PLACED/CONFIRMED can be CANCELLED (buyer while PLACED, seller until READY)

export type OrderStatus =
  | "PENDING_PAYMENT" | "PLACED" | "CONFIRMED" | "READY"
  | "DELIVERED" | "COMPLETED" | "DISPUTED" | "CANCELLED";

export type Actor = "BUYER" | "SELLER" | "SYSTEM";

export type OrderAction =
  | "CONFIRM"          // seller accepts the order
  | "MARK_READY"       // seller: prepared / out for delivery / ready for pickup
  | "MARK_DELIVERED"   // seller: handed over
  | "RECEIVE"          // buyer confirms receipt (SYSTEM does this on auto-release)
  | "CANCEL"
  | "DISPUTE";

export type Transition =
  | { ok: true; to: OrderStatus }
  | { ok: false; reason: string };

const deny = (reason: string): Transition => ({ ok: false, reason });
const go = (to: OrderStatus): Transition => ({ ok: true, to });

export function nextStatus(status: OrderStatus, action: OrderAction, actor: Actor): Transition {
  switch (action) {
    case "CONFIRM":
      if (actor !== "SELLER") return deny("Only the seller can confirm an order.");
      return status === "PLACED" ? go("CONFIRMED") : deny("This order can't be confirmed right now.");

    case "MARK_READY":
      if (actor !== "SELLER") return deny("Only the seller can do this.");
      return status === "CONFIRMED" ? go("READY") : deny("Confirm the order first.");

    case "MARK_DELIVERED":
      if (actor !== "SELLER") return deny("Only the seller can do this.");
      return status === "READY" ? go("DELIVERED") : deny("Mark the order ready first.");

    case "RECEIVE":
      if (actor === "BUYER") {
        return status === "READY" || status === "DELIVERED"
          ? go("COMPLETED")
          : deny("You can confirm receipt once the seller has the order ready.");
      }
      if (actor === "SYSTEM") {
        // Auto-release is only ever allowed after the seller says it was delivered.
        return status === "DELIVERED" ? go("COMPLETED") : deny("Not eligible for auto-release.");
      }
      return deny("Only the buyer can confirm receipt.");

    case "CANCEL":
      if (actor === "BUYER") {
        return status === "PENDING_PAYMENT" || status === "PLACED"
          ? go("CANCELLED")
          : deny("The seller has already started this order. Raise a dispute if there's a problem.");
      }
      if (actor === "SELLER") {
        return status === "PLACED" || status === "CONFIRMED"
          ? go("CANCELLED")
          : deny("You can only cancel before the order is ready.");
      }
      // SYSTEM: expiry of an unpaid order
      return status === "PENDING_PAYMENT" ? go("CANCELLED") : deny("Only unpaid orders expire.");

    case "DISPUTE":
      if (actor !== "BUYER") return deny("Only the buyer can raise a dispute.");
      return status === "READY" || status === "DELIVERED"
        ? go("DISPUTED")
        : deny("A dispute can be raised once the order is ready or delivered, before you confirm receipt.");
  }
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PLACED: "New order",
  CONFIRMED: "Confirmed",
  READY: "Ready / on the way",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  DISPUTED: "In dispute",
  CANCELLED: "Cancelled",
};
