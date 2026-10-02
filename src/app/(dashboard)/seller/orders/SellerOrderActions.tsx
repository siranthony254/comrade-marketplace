"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, FileImage } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import { btnDanger, btnPrimary } from "@/lib/ui";

type Action = "CONFIRM" | "MARK_READY" | "MARK_DELIVERED" | "CANCEL";

// What the seller can do next, by status. The server independently enforces the same rules.
const NEXT: Record<string, { action: Action; label: string }> = {
  PLACED: { action: "CONFIRM", label: "Confirm order" },
  CONFIRMED: { action: "MARK_READY", label: "Mark ready / on the way" },
  READY: { action: "MARK_DELIVERED", label: "Mark delivered" },
};

interface Props {
  orderId: string;
  status: string;
  paymentMode: "ESCROW" | "ON_DELIVERY" | "DIRECT_TRANSFER";
  buyerMarkedPaidAt: boolean;
  sellerConfirmedPaidAt: boolean;
  buyerPaymentRef: string | null;
  hasProof: boolean;
}

export function SellerOrderActions({ orderId, status, paymentMode, buyerMarkedPaidAt, sellerConfirmedPaidAt, buyerPaymentRef, hasProof }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try { await fn(); router.refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  const act = (action: Action, reason?: string) => run(() => api(`/api/orders/${orderId}/action`, { json: { action, reason } }));

  const next = NEXT[status];
  const canCancel = status === "PLACED" || status === "CONFIRMED";
  const needsPaymentCheck = paymentMode === "DIRECT_TRANSFER" && status === "PLACED" && !sellerConfirmedPaidAt;

  if (needsPaymentCheck) {
    if (!buyerMarkedPaidAt) {
      return <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5 shrink-0" />Waiting for the buyer to send payment.</p>;
    }
    return (
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 space-y-2 text-sm text-blue-950">
        <p>The buyer says they&apos;ve paid{buyerPaymentRef ? <> — reference <strong className="font-mono">{buyerPaymentRef}</strong></> : ""}.</p>
        {hasProof && <a href={`/api/orders/${orderId}/payment-proof`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline"><FileImage className="w-3.5 h-3.5" />View their screenshot</a>}
        <p className="text-xs text-blue-900/80">Check your own M-Pesa messages before confirming — don&apos;t just trust this claim.</p>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => run(() => api(`/api/orders/${orderId}/confirm-payment`, { method: "POST" }))} className={`${btnPrimary} flex-1`}>✅ Yes, I&apos;ve received it</button>
          <button disabled={busy} onClick={() => { const r = prompt("Why are you declining? (the buyer will see this)"); if (r) act("CANCEL", r); }} className={btnDanger}>Haven&apos;t received anything</button>
        </div>
      </div>
    );
  }

  if (!next && !canCancel) {
    return status === "DELIVERED" ? <p className="text-xs text-muted-foreground">Waiting for the buyer to confirm receipt. If they don&apos;t respond, the order completes automatically.</p> : null;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {next && <button disabled={busy} onClick={() => act(next.action)} className={`${btnPrimary} flex-1`}>{next.label}</button>}
        {canCancel && <button disabled={busy} onClick={() => { const r = prompt("Why are you cancelling? (the buyer will see this)"); if (r) act("CANCEL", r); }} className={btnDanger}>Decline</button>}
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
