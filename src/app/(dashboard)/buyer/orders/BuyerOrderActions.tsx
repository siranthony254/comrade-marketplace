"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Smartphone, Star } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import { btnDanger, btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface MpesaInfo { name: string; mpesaMethod: "TILL" | "PAYBILL" | "PHONE" | null; mpesaNumber: string | null; mpesaAccount: string | null }

interface Props {
  orderId: string;
  status: string;
  paymentMode: "ESCROW" | "ON_DELIVERY" | "DIRECT_TRANSFER";
  hasReview: boolean;
  autoOpenPay: boolean;
  devSimulation: boolean;
  lastPayment: { status: string; failReason: string | null } | null;
  autoReleaseAt: string | null;
  business: MpesaInfo;
  buyerMarkedPaidAt: boolean;
  sellerConfirmedPaidAt: boolean;
}

function mpesaLabel(b: MpesaInfo): string {
  if (!b.mpesaMethod || !b.mpesaNumber) return "Ask the seller how to pay them.";
  if (b.mpesaMethod === "TILL") return `Buy Goods, Till number ${b.mpesaNumber}`;
  if (b.mpesaMethod === "PAYBILL") return `Pay Bill ${b.mpesaNumber}${b.mpesaAccount ? `, account ${b.mpesaAccount}` : ""}`;
  return `Send to 0${b.mpesaNumber.slice(3)}`;
}

export function BuyerOrderActions({ orderId, status, paymentMode, hasReview, devSimulation, lastPayment, autoReleaseAt, business, buyerMarkedPaidAt, sellerConfirmedPaidAt }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [dispute, setDispute] = useState<{ reason: string; description: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState<File | null>(null);

  // While waiting for the M-Pesa PIN, ask the server every 4s. The server asks the payment
  // provider, so this works even if the webhook is delayed.
  useEffect(() => {
    if (status !== "PENDING_PAYMENT") return;
    const t = setInterval(async () => {
      try {
        const r = await api<{ status: string }>(`/api/orders/${orderId}/pay`);
        if (r.status !== "PENDING_PAYMENT") router.refresh();
      } catch { /* keep polling */ }
    }, 4000);
    return () => clearInterval(t);
  }, [status, orderId, router]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setInfo("");
    try { await fn(); router.refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  const act = (action: string, extra: object = {}) => run(() => api(`/api/orders/${orderId}/action`, { json: { action, ...extra } }));

  async function submitMarkPaid() {
    if (!reference.trim() && !proof) return setError("Add the M-Pesa code, a screenshot, or both.");
    await run(async () => {
      const form = new FormData();
      if (reference.trim()) form.append("reference", reference.trim());
      if (proof) form.append("proof", proof);
      await api(`/api/orders/${orderId}/mark-paid`, { form });
    });
  }

  if (status === "PENDING_PAYMENT") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3 text-sm text-amber-950">
        <p className="flex items-start gap-2"><Smartphone className="w-5 h-5 shrink-0" /><span><strong>Check your phone.</strong> Enter your M-Pesa PIN to pay. This page updates automatically. Your order is held for 15 minutes.</span></p>
        {lastPayment?.status === "FAILED" && <p className="text-red-700">The last payment didn&apos;t go through{lastPayment.failReason ? ` (${lastPayment.failReason})` : ""}. You can try again.</p>}
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => run(async () => { const r = await api<{ alreadyPrompting?: boolean; ok: boolean; error?: string }>(`/api/orders/${orderId}/pay`, { method: "POST" }); if (!r.ok) throw new Error(r.error); setInfo(r.alreadyPrompting ? "A prompt was just sent. Give it a moment." : "New M-Pesa prompt sent."); })} className={btnSecondary}>Didn&apos;t get a prompt? Resend</button>
          <button disabled={busy} onClick={() => act("CANCEL", { reason: "Cancelled by buyer" })} className={btnDanger}>Cancel order</button>
          {devSimulation && (<>
            <button disabled={busy} onClick={() => run(() => api("/api/dev/simulate-payment", { json: { orderId, result: "SUCCEEDED" } }))} className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-white">DEV: simulate paid</button>
            <button disabled={busy} onClick={() => run(() => api("/api/dev/simulate-payment", { json: { orderId, result: "FAILED" } }))} className="text-xs px-3 py-2 rounded-lg bg-slate-600 text-white">DEV: simulate failure</button>
          </>)}
        </div>
        {info && <p>{info}</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
      </div>
    );
  }

  const needsDirectPay = paymentMode === "DIRECT_TRANSFER" && status === "PLACED";

  return (
    <div className="space-y-3">
      {needsDirectPay && !buyerMarkedPaidAt && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-3 text-sm text-blue-950">
          <p className="flex items-start gap-2"><Smartphone className="w-5 h-5 shrink-0" /><span><strong>Pay {business.name} directly:</strong> {mpesaLabel(business)}.</span></p>
          <p className="text-xs text-blue-900/80">⚠️ This goes straight to the seller — Comrade Market can&apos;t hold or retrieve this money. Keep your M-Pesa confirmation message in case there&apos;s ever a dispute.</p>
          <div><label className={labelCls}>M-Pesa confirmation code (recommended)</label><input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. QFT5X7YABC" className={inputCls} /></div>
          <div><label className={labelCls}>Or attach a screenshot of the M-Pesa message</label><input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)} className="text-xs" /></div>
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <button disabled={busy} onClick={submitMarkPaid} className={`${btnPrimary} w-full`}>I&apos;ve sent the payment</button>
        </div>
      )}

      {needsDirectPay && buyerMarkedPaidAt && !sellerConfirmedPaidAt && (
        <p className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3"><Clock className="w-4 h-4 shrink-0" />Waiting for {business.name} to confirm they&apos;ve received your payment.</p>
      )}

      {status === "PLACED" && paymentMode !== "DIRECT_TRANSFER" && <button disabled={busy} onClick={() => act("CANCEL", { reason: "Cancelled by buyer" })} className={btnDanger}>Cancel order</button>}
      {status === "PLACED" && paymentMode === "DIRECT_TRANSFER" && !buyerMarkedPaidAt && <button disabled={busy} onClick={() => act("CANCEL", { reason: "Cancelled by buyer" })} className={btnDanger}>Cancel order</button>}

      {(status === "READY" || status === "DELIVERED") && !dispute && (
        <div className="space-y-2">
          {status === "DELIVERED" && autoReleaseAt && <p className="text-xs text-muted-foreground">Confirm within {Math.max(1, Math.round((new Date(autoReleaseAt).getTime() - Date.now()) / 3_600_000))} hours or it completes automatically{paymentMode === "ESCROW" ? " and the seller is paid" : ""}.</p>}
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => act("RECEIVE")} className={`${btnPrimary} flex-1`}>I received it{paymentMode === "ESCROW" ? " — release payment" : ""}</button>
            <button disabled={busy} onClick={() => setDispute({ reason: "", description: "" })} className={btnDanger}>Report a problem</button>
          </div>
        </div>
      )}

      {dispute && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
          <div><label className={labelCls}>What went wrong?</label>
            <select value={dispute.reason} onChange={(e) => setDispute({ ...dispute, reason: e.target.value })} className={inputCls}>
              <option value="">Choose…</option>{["Item not received", "Not as described", "Wrong item", "Poor quality", "Other"].map((r) => <option key={r}>{r}</option>)}
            </select></div>
          <div><label className={labelCls}>Tell us what happened</label><textarea rows={3} maxLength={1000} value={dispute.description} onChange={(e) => setDispute({ ...dispute, description: e.target.value })} className={inputCls} /></div>
          <p className="text-xs text-muted-foreground">{paymentMode === "ESCROW" ? "The seller won't be paid while we review this." : "This payment went directly to the seller, so we can't freeze or refund it ourselves — but we'll help mediate."}</p>
          <div className="flex gap-2"><button onClick={() => setDispute(null)} className={`${btnSecondary} flex-1`}>Back</button><button disabled={busy || !dispute.reason || dispute.description.length < 10} onClick={() => act("DISPUTE", dispute)} className={`${btnDanger} flex-1`}>Submit</button></div>
        </div>
      )}

      {status === "COMPLETED" && !hasReview && (
        <div className="rounded-xl border border-border p-3 space-y-2">
          <p className="text-sm font-medium">How was it?</p>
          <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}><Star className={cn("w-7 h-7", n <= rating ? "fill-secondary text-secondary" : "text-muted-foreground")} /></button>)}</div>
          {rating > 0 && (<>
            <input value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} placeholder="Say a few words (optional)" className={inputCls} />
            <button disabled={busy} onClick={() => run(() => api(`/api/orders/${orderId}/review`, { json: { rating, comment: comment || null } }))} className={btnPrimary}>Submit review</button>
          </>)}
        </div>
      )}
      {error && !needsDirectPay && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
