// src/lib/money.ts
// All money is whole KES held in integers. This file is the only place fees
// and payment-mode rules are calculated.

import { PLATFORM } from "@/lib/constants/platform";

export type PaymentMode = "ESCROW" | "ON_DELIVERY";

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
 *  - any SERVICE item       -> escrow only (this is the anti-scam case)
 *  - total >= 300           -> escrow only
 *  - total < 100            -> on-delivery only (escrow isn't worth its cost)
 *  - otherwise              -> buyer chooses
 */
export function allowedPaymentModes(total: number, hasService: boolean): PaymentModeRule {
  if (hasService) return { allowed: ["ESCROW"], reason: "Services are always protected by escrow." };
  if (total >= PLATFORM.escrow.requiredAtOrAboveKes) {
    return { allowed: ["ESCROW"], reason: "Orders of this size are protected by escrow." };
  }
  if (total < PLATFORM.escrow.unavailableBelowKes) {
    return { allowed: ["ON_DELIVERY"], reason: "Small orders are paid directly to the seller on delivery." };
  }
  return { allowed: ["ESCROW", "ON_DELIVERY"], reason: "Choose how you want to pay." };
}

/** e.g. CM-7K3P9Q — unambiguous alphabet (no 0/O/1/I) so it's safe to read out over a call. */
export function generateOrderNumber(random: () => number = Math.random): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(random() * alphabet.length)];
  return `CM-${out}`;
}
