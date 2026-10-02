"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import { formatKes } from "@/lib/money";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";
import { cn } from "@/lib/utils";

type Type = "PHYSICAL" | "SERVICE" | "DIGITAL";
interface Product { id: string; name: string; description: string; type: Type; price: number; costPrice: number | null; stock: number | null; lowStockAlert: number | null; turnaroundDays: number | null; images: string[]; isActive: boolean }

const BLANK: Omit<Product, "id"> = { name: "", description: "", type: "PHYSICAL", price: 0, costPrice: null, stock: 10, lowStockAlert: 3, turnaroundDays: null, images: [], isActive: true };
const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

export function ProductManager({ products, limit, canEdit }: { products: Product[]; limit: number; canEdit: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<(Omit<Product, "id"> & { id?: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function addImage(file: File | undefined) {
    if (!file || !editing) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api<{ url: string }>("/api/uploads/image", { form });
      setEditing((e) => e && { ...e, images: [...e.images, r.url].slice(0, 4) });
    } catch (e) { setError(errorMessage(e)); } finally { setUploading(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      const { id, ...body } = editing;
      await api(id ? `/api/seller/products/${id}` : "/api/seller/products", { method: id ? "PATCH" : "POST", json: body });
      setEditing(null);
      router.refresh();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  async function remove(p: Product) {
    if (!confirm(`Remove "${p.name}"?`)) return;
    try { await api(`/api/seller/products/${p.id}`, { method: "DELETE" }); router.refresh(); } catch (e) { alert(errorMessage(e)); }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Products &amp; services</h1>
          <p className="text-sm text-muted-foreground">{products.length} of {limit} listings used (free plan)</p>
        </div>
        <button disabled={!canEdit || products.length >= limit} onClick={() => { setError(""); setEditing({ ...BLANK }); }} className={btnPrimary}><Plus className="w-4 h-4" />Add</button>
      </div>
      {!canEdit && <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3">You can add listings once your student ID is approved.</p>}

      {products.length === 0 ? (
        <div className="stat-card text-center py-12 text-sm text-muted-foreground">No listings yet. Add your first product or service.</div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const low = p.stock !== null && p.stock <= (p.lowStockAlert ?? 3);
            return (
              <div key={p.id} className={cn("stat-card flex gap-3 items-center", !p.isActive && "opacity-60")}>
                {p.images[0] ? <img src={p.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" /> : <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{formatKes(p.price)} · {p.type === "SERVICE" ? "Service" : p.stock === null ? "Unlimited" : <span className={low ? "text-amber-700 font-medium" : ""}>{p.stock} in stock</span>}{!p.isActive && " · Hidden"}</p>
                </div>
                <button onClick={() => { setError(""); setEditing(p); }} disabled={!canEdit} aria-label="Edit" className="p-2 rounded-lg hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(p)} disabled={!canEdit} aria-label="Remove" className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={save} className="bg-card w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">{editing.id ? "Edit listing" : "New listing"}</h2><button type="button" onClick={() => setEditing(null)} aria-label="Close"><X className="w-5 h-5" /></button></div>

            <div className="flex gap-2">
              {(["PHYSICAL", "SERVICE"] as const).map((t) => (
                <button type="button" key={t} onClick={() => setEditing({ ...editing, type: t, stock: t === "PHYSICAL" ? editing.stock ?? 10 : null })} className={cn("flex-1 py-2 rounded-lg border text-sm font-medium", editing.type === t ? "border-primary bg-accent text-primary" : "border-border")}>{t === "PHYSICAL" ? "Product" : "Service"}</button>
              ))}
            </div>

            <div><label className={labelCls}>Name</label><input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Description</label><textarea required rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Price (KES)</label><input required type="number" min={10} value={editing.price || ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inputCls} /></div>
              <div><label className={labelCls}>Your cost (private)</label><input type="number" min={0} value={editing.costPrice ?? ""} onChange={(e) => setEditing({ ...editing, costPrice: num(e.target.value) })} className={inputCls} /></div>
            </div>
            {editing.type === "PHYSICAL" ? (
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>In stock</label><input type="number" min={0} value={editing.stock ?? ""} onChange={(e) => setEditing({ ...editing, stock: num(e.target.value) })} className={inputCls} /></div>
                <div><label className={labelCls}>Warn me at</label><input type="number" min={0} value={editing.lowStockAlert ?? ""} onChange={(e) => setEditing({ ...editing, lowStockAlert: num(e.target.value) })} className={inputCls} /></div>
              </div>
            ) : (
              <div><label className={labelCls}>Turnaround (days)</label><input type="number" min={1} value={editing.turnaroundDays ?? ""} onChange={(e) => setEditing({ ...editing, turnaroundDays: num(e.target.value) })} className={inputCls} /></div>
            )}

            <div>
              <label className={labelCls}>Photos (up to 4)</label>
              <div className="flex gap-2 flex-wrap">
                {editing.images.map((u) => (
                  <div key={u} className="relative"><img src={u} alt="" className="w-16 h-16 rounded-lg object-cover" /><button type="button" onClick={() => setEditing({ ...editing, images: editing.images.filter((x) => x !== u) })} aria-label="Remove photo" className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"><X className="w-3 h-3" /></button></div>
                ))}
                {editing.images.length < 4 && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer text-muted-foreground hover:border-primary">
                    {uploading ? <span className="text-[10px]">…</span> : <ImagePlus className="w-5 h-5" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { addImage(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Visible on my storefront</label>
            {editing.type === "SERVICE" && <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">Services are always paid through escrow, so both you and your customer are protected.</p>}

            {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-2"><button type="button" onClick={() => setEditing(null)} className={`${btnSecondary} flex-1`}>Cancel</button><button disabled={busy} className={`${btnPrimary} flex-1`}>{busy ? "Saving…" : "Save"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
