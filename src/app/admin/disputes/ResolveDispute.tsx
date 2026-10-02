"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { btnPrimary, btnSecondary, inputCls } from "@/lib/ui";

export function ResolveDispute({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function resolve(outcome: "BUYER" | "SELLER") {
    if (!confirm(outcome === "BUYER" ? "Refund the buyer? This cannot be undone." : "Pay the seller? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try { await api(`/api/admin/disputes/${disputeId}/resolve`, { json: { outcome, note } }); router.refresh(); } catch (e) { setError(errorMessage(e)); setBusy(false); }
  }

  return (
    <div className="space-y-2">
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Your decision and reasoning (both parties will see this)" className={inputCls} />
      <div className="flex gap-2">
        <button disabled={busy || note.trim().length < 5} onClick={() => resolve("BUYER")} className={`${btnSecondary} flex-1`}>Refund buyer</button>
        <button disabled={busy || note.trim().length < 5} onClick={() => resolve("SELLER")} className={`${btnPrimary} flex-1`}>Pay seller</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
