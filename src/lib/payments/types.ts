// src/lib/payments/types.ts
// The seam between the app and any payment provider. The escrow logic in
// services/orders.ts only talks to this interface, so swapping IntaSend for
// another provider (or the mock) touches nothing else.

export type CollectionState = "PENDING" | "SUCCEEDED" | "FAILED";
export type PayoutState = "PROCESSING" | "SUCCEEDED" | "FAILED";

export interface RequestPaymentInput {
  apiRef: string;   // our unique reference; comes back in webhooks
  amount: number;   // whole KES
  phone: string;    // 2547XXXXXXXX
  narrative: string;
  buyer: { firstName: string; lastName: string; email: string };
}

export interface SendPayoutInput {
  apiRef: string;
  amount: number;
  phone: string;
  recipient: string;
  narrative: string;
}

export interface VerifiedWebhook {
  eventKey: string;     // unique per (provider event) — used for idempotency
  providerRef: string;  // provider's invoice id
  apiRef?: string;
}

export interface PaymentProvider {
  readonly name: "mock" | "intasend";

  /** Start an M-Pesa STK push. Returns the provider's reference. Must NOT be treated as success. */
  requestPayment(input: RequestPaymentInput): Promise<{ providerRef: string }>;

  /** Ask the provider — the source of truth — what happened to a collection. */
  getPaymentStatus(providerRef: string): Promise<{ state: CollectionState; failReason?: string }>;

  /** Send money out (seller payout / buyer refund). */
  sendPayout(input: SendPayoutInput): Promise<{ providerRef: string; state: PayoutState }>;

  getPayoutStatus(providerRef: string): Promise<{ state: PayoutState; failReason?: string }>;

  /**
   * Authenticate an incoming webhook. Returns null if it isn't genuine.
   * The result only identifies WHICH payment to look at — callers must confirm the
   * outcome with getPaymentStatus(), never trust the state in the webhook body.
   */
  verifyWebhook(rawBody: string, headers: Headers): VerifiedWebhook | null;
}
