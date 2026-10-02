"use client";

// Product list + cart + checkout for one storefront.
// The client only ever sends product ids and quantities. Prices, totals and which payment
// modes are allowed are re-computed on the server; the numbers shown here are for display.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Minus, Plus, ShieldCheck, ShoppingBag, Smartphone, Wrench } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import { allowedPaymentModes, formatKes, type PaymentMode } from "@/lib/money";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

export type ViewerState = { kind: "anon" } | { kind: "pending" } | { kind: "owner" } | { kind: "buyer"; phone: string };

interface P { id: string; name: string; description: string; type: "PHYSICAL" | "SERVICE" | "DIGITAL"; price: number; stock: number | null; image: string | null; turnaroundDays: number | null }
interface B {
  id: string; name: string; isOpen: boolean; acceptsDelivery: boolean;
  mpesaMethod: "TILL" | "PAYBILL" | "PHONE" | null; mpesaNumber: string | null; mpesaAccount: string | null;
}

function mpesaLabel(b: B): string | null {
  if (!b.mpesaMethod || !b.mpesaNumber) return null;
  if (b.mpesaMethod === "TILL") return `Buy Goods, Till number ${b.mpesaNumber}`;
  if (b.mpesaMethod === "PAYBILL") return `Pay Bill ${b.mpesaNumber}${b.mpesaAccount ? `, account ${b.mpesaAccount}` : ""}`;
  return `Send money to 0${b.mpesaNumber.slice(3)}`;
}

export function StorefrontOrder({ slug, business, products, viewer, escrowAvailable }: { slug: string; business: B; products: P[]; viewer: ViewerState; escrowAvailable: boolean }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [delivery, setDelivery] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(viewer.kind === "buyer" ? `0${viewer.phone.slice(3)}` : "");
  const [mode, setMode] = useState<PaymentMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const lines = useMemo(() => products.filter((p) => cart[p.id]).map((p) => ({ p, qty: cart[p.id]! })), [cart, products]);
  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const hasService = lines.some((l) => l.p.type === "SERVICE");
  const mpesa = mpesaLabel(business);
  const rawRule = allowedPaymentModes(total, hasService, escrowAvailable);
  // The seller might not have set up M-Pesa collection yet — don't offer what they can't receive.
  const rule = mpesa ? rawRule : { ...rawRule, allowed: rawRule.allowed.filter((m) => m !== "DIRECT_TRANSFER") };
  const chosen: PaymentMode = mode && rule.allowed.includes(mode) ? mode : rule.allowed[0]!;
  const canOrder = viewer.kind === "buyer" && business.isOpen;
  const methods: ("PICKUP" | "DELIVERY")[] = business.acceptsDelivery ? ["PICKUP", "DELIVERY"] : ["PICKUP"];

  function change(p: P, delta: number) {
    setCart((c) => {
      const next = Math.max(0, (c[p.id] ?? 0) + delta);
      const capped = p.stock === null ? next : Math.min(next, p.stock);
      const { [p.id]: _drop, ...rest } = c;
      return capped > 0 ? { ...rest, [p.id]: capped } : rest;
    });
  }

  async function checkout() {
    setError("");
    setBusy(true);
    try {
      const r = await api<{ orderId: string; orderNumber: string; paymentMode: PaymentMode; payment: { ok: boolean; error?: string } | null }>("/api/orders", {
        json: {
          businessId: business.id,
          items: lines.map((l) => ({ productId: l.p.id, quantity: l.qty })),
          paymentMode: chosen,
          deliveryMethod: delivery,
          deliveryAddress: delivery === "DELIVERY" ? address : null,
          buyerNote: note || null,
          phone,
        },
      });
      const dest =
        r.paymentMode === "ESCROW" ? `/buyer/orders?pay=${r.orderId}`
        : r.paymentMode === "DIRECT_TRANSFER" ? `/buyer/orders?directPay=${r.orderId}`
        : `/buyer/orders?placed=${r.orderNumber}`;
      router.push(dest);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="font-display text-xl font-bold mb-4">{products.length ? "What's on offer" : "Nothing listed yet"}</h2>

      <div className="space-y-3">
        {products.map((p) => {
          const qty = cart[p.id] ?? 0;
          const out = p.stock !== null && p.stock <= 0;
          return (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 flex gap-3">
              {p.image ? (
                <img src={p.image} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-accent text-primary flex items-center justify-center shrink-0">{p.type === "SERVICE" ? <Wrench className="w-7 h-7" /> : <ShoppingBag className="w-7 h-7" />}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{p.name}</h3>
                  <span className="font-bold text-primary whitespace-nowrap">{formatKes(p.price)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className="text-xs text-gray-500">
                    {p.type === "SERVICE" ? `Service${p.turnaroundDays ? ` · ${p.turnaroundDays} day${p.turnaroundDays === 1 ? "" : "s"}` : ""} · escrow protected` : out ? "Sold out" : p.stock !== null && p.stock <= 5 ? `Only ${p.stock} left` : ""}
                  </span>
                  {canOrder && !out && (
                    qty === 0 ? (
                      <button onClick={() => change(p, 1)} className="text-sm font-semibold bg-primary text-white px-3 py-1.5 rounded-lg">Add</button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => change(p, -1)} aria-label="Remove one" className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                        <span className="w-5 text-center font-semibold">{qty}</span>
                        <button onClick={() => change(p, 1)} aria-label="Add one" className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {viewer.kind === "anon" && (
        <p className="mt-5 text-sm bg-white border border-gray-200 rounded-xl p-4">
          <Link href={`/login?next=/${slug}`} className="text-primary font-semibold underline">Sign in</Link> or{" "}
          <Link href="/register" className="text-primary font-semibold underline">join free</Link> with your student ID to order from {business.name}.
        </p>
      )}
      {viewer.kind === "pending" && <p className="mt-5 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">Your student ID is still being reviewed. You&apos;ll be able to order as soon as it&apos;s approved.</p>}
      {viewer.kind === "owner" && <p className="mt-5 text-sm bg-white border border-gray-200 rounded-xl p-4">This is how customers see your page. <Link href="/seller/storefront" className="text-primary font-semibold underline">Edit your storefront</Link></p>}
      {viewer.kind === "buyer" && !business.isOpen && <p className="mt-5 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4">{business.name} isn&apos;t taking orders right now.</p>}

      {lines.length > 0 && canOrder && (
        <div className="mt-6 bg-white border-2 border-primary/30 rounded-2xl p-4 sm:p-5 space-y-4">
          <h3 className="font-display font-bold text-lg">Your order</h3>
          <ul className="text-sm space-y-1">
            {lines.map((l) => <li key={l.p.id} className="flex justify-between"><span>{l.qty} × {l.p.name}</span><span>{formatKes(l.p.price * l.qty)}</span></li>)}
          </ul>
          <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{formatKes(total)}</span></div>

          <div>
            <p className={labelCls}>How do you want to get it?</p>
            <div className="flex gap-2">
              {methods.map((m) => (
                <button key={m} onClick={() => setDelivery(m)} className={cn("flex-1 py-2 rounded-lg border text-sm font-medium", delivery === m ? "border-primary bg-accent text-primary" : "border-gray-300")}>{m === "PICKUP" ? "Pick up" : "Deliver to me"}</button>
              ))}
            </div>
            {delivery === "DELIVERY" && <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Hostel / room / where to find you" className={`${inputCls} mt-2`} />}
          </div>

          {rule.allowed.length === 0 ? (
            <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3">
              {business.name} can&apos;t take this kind of order yet — ask them to set up M-Pesa payments on their storefront first.
            </p>
          ) : (
            <>
              <div>
                <p className={labelCls}>How do you want to pay?</p>
                <div className="space-y-2">
                  {(["ESCROW", "ON_DELIVERY", "DIRECT_TRANSFER"] as const).map((m) => {
                    const allowed = rule.allowed.includes(m);
                    return (
                      <button key={m} disabled={!allowed} onClick={() => setMode(m)} className={cn("w-full text-left p-3 rounded-lg border text-sm", chosen === m ? "border-primary bg-accent" : "border-gray-300", !allowed && "opacity-40 cursor-not-allowed")}>
                        <span className="font-semibold flex items-center gap-1.5">
                          {m === "ESCROW" && <><ShieldCheck className="w-4 h-4 text-primary" />Pay now with M-Pesa — protected</>}
                          {m === "ON_DELIVERY" && "Pay the seller when you get it"}
                          {m === "DIRECT_TRANSFER" && <><Smartphone className="w-4 h-4 text-primary" />Send M-Pesa directly to {business.name}</>}
                        </span>
                        <span className="block text-xs text-gray-600 mt-0.5">
                          {m === "ESCROW" && "We hold your money and only release it to the seller after you confirm you received your order."}
                          {m === "ON_DELIVERY" && "Cash, in person. Not protected by escrow."}
                          {m === "DIRECT_TRANSFER" && (mpesa ? `${mpesa}. Goes straight to the seller — Comrade Market doesn't hold or protect this payment.` : "This seller hasn't set up M-Pesa payments yet.")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{rule.reason}</p>
              </div>

              <div><label className={labelCls}>{chosen === "ESCROW" ? "M-Pesa number to pay from" : "Your phone number (so the seller can reach you)"}</label><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={inputCls} /></div>
              <div><label className={labelCls}>Note to seller (optional)</label><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className={inputCls} placeholder="e.g. no onions please" /></div>

              {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <button onClick={checkout} disabled={busy || !phone || (delivery === "DELIVERY" && !address)} className={`${btnPrimary} w-full py-3`}>
                {busy ? "Placing order…" : chosen === "ESCROW" ? `Pay ${formatKes(total)} securely` : `Place order · ${formatKes(total)}`}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
