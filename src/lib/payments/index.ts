// src/lib/payments/index.ts
import type { PaymentProvider } from "./types";
import { mockProvider } from "./mock";
import { intasendProvider } from "./intasend";

/** PAYMENT_PROVIDER=mock|intasend. In production it must be set explicitly — no silent fallback to the mock. */
export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? (process.env.NODE_ENV === "production" ? "" : "mock");
  if (name === "mock") {
    if (process.env.NODE_ENV === "production") throw new Error("The mock payment provider must never run in production");
    return mockProvider;
  }
  if (name === "intasend") return intasendProvider;
  throw new Error(`PAYMENT_PROVIDER must be "mock" or "intasend" (got "${name}")`);
}

export type { PaymentProvider } from "./types";
