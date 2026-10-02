// src/lib/payments/intasend.ts
// IntaSend adapter (M-Pesa STK push in, M-Pesa B2C out).
//
// ⚠️  UNTESTED AGAINST THE LIVE API. Endpoints and payload shapes were taken from the
// installed intasend-node SDK source and IntaSend's public docs; RESPONSE shapes are read
// defensively (optional chaining) and anything unrecognised is treated as "not successful",
// never as success. Before going live, run the full flow in the IntaSend SANDBOX
// (INTASEND_TEST_MODE=true) and fix any field name that differs.

import { timingSafeEqual } from "node:crypto";
import IntaSend from "intasend-node";
import type { CollectionState, PaymentProvider, PayoutState } from "./types";

function client() {
  const pub = process.env.INTASEND_PUBLISHABLE_KEY;
  const secret = process.env.INTASEND_SECRET_KEY;
  if (!pub || !secret) throw new Error("INTASEND_PUBLISHABLE_KEY / INTASEND_SECRET_KEY are not set");
  return new IntaSend(pub, secret, process.env.INTASEND_TEST_MODE !== "false");
}

/** The SDK rejects with raw response bytes on HTTP errors; turn that into a readable Error. */
function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  const text = Buffer.isBuffer(e) ? e.toString("utf8") : typeof e === "string" ? e : JSON.stringify(e);
  return new Error(`IntaSend: ${text.slice(0, 300)}`);
}

function mapCollection(state: unknown): CollectionState {
  switch (String(state ?? "").toUpperCase()) {
    case "COMPLETE": return "SUCCEEDED";
    case "FAILED": return "FAILED";
    default: return "PENDING"; // PENDING, PROCESSING, unknown -> keep waiting
  }
}

function mapPayout(status: unknown): PayoutState {
  const s = String(status ?? "").toLowerCase();
  if (s === "successful" || s === "complete" || s === "completed") return "SUCCEEDED";
  if (s.startsWith("failed") || s === "cancelled" || s === "rejected") return "FAILED";
  return "PROCESSING";
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const intasendProvider: PaymentProvider = {
  name: "intasend",

  async requestPayment(input) {
    try {
      const res = await client().collection().mpesaStkPush({
        first_name: input.buyer.firstName,
        last_name: input.buyer.lastName,
        email: input.buyer.email,
        host: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        amount: input.amount,
        phone_number: input.phone,
        api_ref: input.apiRef,
        narrative: input.narrative,
      });
      const providerRef: string | undefined = res?.invoice?.invoice_id ?? res?.invoice_id;
      if (!providerRef) throw new Error("IntaSend did not return an invoice id");
      return { providerRef };
    } catch (e) {
      throw toError(e);
    }
  },

  async getPaymentStatus(providerRef) {
    try {
      const res = await client().collection().status(providerRef);
      const state = mapCollection(res?.invoice?.state);
      return { state, failReason: state === "FAILED" ? String(res?.invoice?.failed_reason ?? "Payment failed") : undefined };
    } catch (e) {
      throw toError(e);
    }
  },

  async sendPayout(input) {
    try {
      const res = await client().payouts().mpesa({
        currency: "KES",
        requires_approval: "NO",
        transactions: [{ name: input.recipient, account: input.phone, amount: input.amount, narrative: input.narrative }],
      });
      const providerRef: string | undefined = res?.tracking_id;
      if (!providerRef) throw new Error("IntaSend did not return a tracking id");
      return { providerRef, state: mapPayout(res?.transactions?.[0]?.status) };
    } catch (e) {
      throw toError(e);
    }
  },

  async getPayoutStatus(providerRef) {
    try {
      const res = await client().payouts().status({ tracking_id: providerRef });
      const tx = res?.transactions?.[0];
      const state = mapPayout(tx?.status);
      return { state, failReason: state === "FAILED" ? String(tx?.status_description ?? tx?.status ?? "Payout failed") : undefined };
    } catch (e) {
      throw toError(e);
    }
  },

  verifyWebhook(rawBody) {
    const expected = process.env.INTASEND_WEBHOOK_CHALLENGE;
    if (!expected) return null; // refuse everything if the shared secret isn't configured
    let body: { challenge?: string; invoice_id?: string; state?: string; api_ref?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!body.challenge || !body.invoice_id || !safeEqual(body.challenge, expected)) return null;
    return {
      eventKey: `intasend:${body.invoice_id}:${String(body.state ?? "").toUpperCase()}`,
      providerRef: body.invoice_id,
      apiRef: body.api_ref,
    };
  },
};
