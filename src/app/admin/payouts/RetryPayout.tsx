"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { btnSecondary } from "@/lib/ui";

export function RetryPayout({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function retry() {
    if (!confirm("Have you checked the provider dashboard and confirmed this payout did NOT go through?")) return;
    setBusy(true);
    try { await api(`/api/admin/payouts/${payoutId}/retry`, { method: "POST" }); router.refresh(); } catch (e) { alert(errorMessage(e)); } finally { setBusy(false); }
  }
  return <button disabled={busy} onClick={retry} className={btnSecondary}>{busy ? "Retrying…" : "Retry"}</button>;
}
