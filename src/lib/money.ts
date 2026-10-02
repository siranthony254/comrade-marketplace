// src/lib/money.ts
// All money is whole KES held in integers. This file is the only place fees
// and payment-mode rules are calculated.

import { PLATFORM } from "@/lib/constants/platform";

export type PaymentMode = "ESCROW" | "ON_DELIVERY" | "DIRECT_TRANSFER";

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export interface OrderAmounts {
  subtotal: number;
  total: number;
  platformFee: number;
  sellerPayout: number;
}

/** Fee is deducted from the seller's side; the buyer always pays exactly the sum of the items. */
export function calculateAmounts(subtotal: number, mode: PaymentMode): OrderAmounts {
  if (!Number.isInteger(subtotal) || subtotal < 0) {
    throw new Error("subtotal must be a non-negative integer");
  }
  const platformFee = mode === "ESCROW" ? Math.round(subtotal * PLATFORM.fees.escrowRate) : 0;
  return { subtotal, total: subtotal, platformFee, sellerPayout: subtotal - platformFee };
}

export interface PaymentModeRule {
  allowed: PaymentMode[];
  reason: string;
}

/**
 * Which payment modes may an order use?
 *
 * DIRECT_TRANSFER (buyer pays the seller's own till/paybill/phone, outside the platform) has
 * no fee and no size limit, so it's always allowed once the seller has configured one. ESCROW
 * is only offered when `escrowAvailable` is true (a real payment provider is configured) — until
 * then DIRECT_TRANSFER is the only "accountable" option for the cases that would otherwise
 * require escrow:
 *  - any SERVICE item -> needs some accountability (the anti-scam case) -> DIRECT_TRANSFER and/or ESCROW, never plain cash
 *  - total >= 300      -> same reasoning, big enough to warrant a traceable payment
 *  - total < 100       -> escrow fee would be pennies, not worth it -> cash or DIRECT_TRANSFER
 *  - otherwise         -> buyer chooses among whatever's on offer
 */
export function allowedPaymentModes(total: number, hasService: boolean, escrowAvailable: boolean): PaymentModeRule {
  const escrow: PaymentMode[] = escrowAvailable ? ["ESCROW"] : [];

  if (hasService) {
    return { allowed: [...escrow, "DIRECT_TRANSFER"], reason: "Services need a protected or at least traceable payment — never cash." };
  }
  if (total >= PLATFORM.escrow.requiredAtOrAboveKes) {
    return { allowed: [...escrow, "DIRECT_TRANSFER"], reason: "Orders of this size need a protected or at least traceable payment." };
  }
  if (total < PLATFORM.escrow.unavailableBelowKes) {
    return { allowed: ["ON_DELIVERY", "DIRECT_TRANSFER"], reason: "Pay in cash, or send the seller M-Pesa directly." };
  }
  return { allowed: [...escrow, "ON_DELIVERY", "DIRECT_TRANSFER"], reason: "Choose how you want to pay." };
}

/** e.g. CM-7K3P9Q — unambiguous alphabet (no 0/O/1/I) so it's safe to read out over a call. */
export function generateOrderNumber(random: () => number = Math.random): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(random() * alphabet.length)];
  return `CM-${out}`;
}
