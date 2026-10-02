"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { btnDanger, btnPrimary } from "@/lib/ui";

type Action = "CONFIRM" | "MARK_READY" | "MARK_DELIVERED" | "CANCEL";

// What the seller can do next, by status. The server independently enforces the same rules.
const NEXT: Record<string, { action: Action; label: string }> = {
  PLACED: { action: "CONFIRM", label: "Confirm order" },
  CONFIRMED: { action: "MARK_READY", label: "Mark ready / on the way" },
  READY: { action: "MARK_DELIVERED", label: "Mark delivered" },
};

export function SellerOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: Action, reason?: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/orders/${orderId}/action`, { json: { action, reason } });
      router.refresh();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  const next = NEXT[status];
  const canCancel = status === "PLACED" || status === "CONFIRMED";
  if (!next && !canCancel) {
    return status === "DELIVERED" ? <p className="text-xs text-muted-foreground">Waiting for the buyer to confirm receipt. If they don&apos;t respond, the order completes automatically.</p> : null;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {next && <button disabled={busy} onClick={() => run(next.action)} className={`${btnPrimary} flex-1`}>{next.label}</button>}
        {canCancel && <button disabled={busy} onClick={() => { const r = prompt("Why are you cancelling? (the buyer will see this)"); if (r) run("CANCEL", r); }} className={btnDanger}>Decline</button>}
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
