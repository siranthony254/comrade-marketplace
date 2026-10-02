// src/lib/payments/index.ts
import type { PaymentProvider } from "./types";
import { mockProvider } from "./mock";
import { intasendProvider } from "./intasend";

function resolvedProviderName(): string {
  return process.env.PAYMENT_PROVIDER ?? (process.env.NODE_ENV === "production" ? "" : "mock");
}

/**
 * Can an order actually use ESCROW right now, without throwing? True for the mock provider
 * outside production (so the full escrow flow stays testable with no real provider — see
 * src/lib/payments/mock.ts), and for a real provider ("intasend") anywhere. False in
 * production with no real provider configured, which is exactly when getPaymentProvider()
 * would throw. Used to decide which payment modes to even OFFER a buyer.
 */
export function isEscrowAvailable(): boolean {
  const name = resolvedProviderName();
  return name === "intasend" || (name === "mock" && process.env.NODE_ENV !== "production");
}

/** PAYMENT_PROVIDER=mock|intasend. In production it must be set explicitly — no silent fallback to the mock. */
export function getPaymentProvider(): PaymentProvider {
  const name = resolvedProviderName();
  if (name === "mock") {
    if (process.env.NODE_ENV === "production") throw new Error("The mock payment provider must never run in production");
    return mockProvider;
  }
  if (name === "intasend") return intasendProvider;
  throw new Error(`PAYMENT_PROVIDER must be "mock" or "intasend" (got "${name}")`);
}

export type { PaymentProvider } from "./types";
