// src/lib/payments/mock.ts
// Development provider. Nothing leaves your machine. An STK push "succeeds" when you
// press the "Simulate payment" button on the order page (POST /api/dev/simulate-payment),
// which lets you exercise the whole escrow flow with no provider account.

import type { PaymentProvider } from "./types";

// Survives Next.js dev hot-reloads.
const g = globalThis as unknown as { __mockPayments?: Map<string, "PENDING" | "SUCCEEDED" | "FAILED"> };
const state = (g.__mockPayments ??= new Map());

export const mockControl = {
  settle(providerRef: string, result: "SUCCEEDED" | "FAILED") {
    state.set(providerRef, result);
  },
};

export const mockProvider: PaymentProvider = {
  name: "mock",

  async requestPayment(input) {
    const providerRef = `mock_${input.apiRef}`;
    state.set(providerRef, "PENDING");
    console.log(`[payments:mock] STK push KES ${input.amount} -> +${input.phone} (${input.apiRef})`);
    return { providerRef };
  },

  async getPaymentStatus(providerRef) {
    const s = state.get(providerRef) ?? "PENDING";
    return { state: s, failReason: s === "FAILED" ? "Simulated failure" : undefined };
  },

  async sendPayout(input) {
    console.log(`[payments:mock] PAYOUT KES ${input.amount} -> +${input.phone} (${input.recipient}) ref=${input.apiRef}`);
    return { providerRef: `mockpayout_${input.apiRef}`, state: "SUCCEEDED" };
  },

  async getPayoutStatus() {
    return { state: "SUCCEEDED" };
  },

  verifyWebhook() {
    return null; // the mock has no webhooks
  },
};
